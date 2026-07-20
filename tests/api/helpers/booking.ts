import { APIRequestContext, expect } from '@playwright/test';

// Published demo credentials for the public sandbox, overridable via env.
// In a real project these would come from CI secret storage, never the repo.
export const AUTH = {
  username: process.env.BOOKER_USER ?? 'admin',
  password: process.env.BOOKER_PASS ?? 'password123',
};

export interface BookingPayload {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds: string;
}

let seq = 0;

// Unique names per call so tests never collide with each other or with
// other users of the shared public sandbox.
export function makeBookingPayload(overrides: Partial<BookingPayload> = {}): BookingPayload {
  seq += 1;
  return {
    firstname: `Suite${Date.now()}`,
    lastname: `Run${seq}`,
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: '2026-08-01', checkout: '2026-08-05' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

export async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post('/auth', { data: AUTH });
  expect(res.status()).toBe(200);
  const body = await res.json();
  // Bad credentials also return 200 here, with a "reason" body instead of a
  // token, so the token itself is the thing to assert on.
  expect(body.token, 'auth should return a token').toBeTruthy();
  return body.token;
}

export async function createBooking(
  request: APIRequestContext,
  payload: BookingPayload
): Promise<number> {
  const res = await request.post('/booking', { data: payload });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(typeof body.bookingid, 'create should return a numeric bookingid').toBe('number');
  return body.bookingid;
}

export async function deleteBooking(
  request: APIRequestContext,
  id: number,
  token: string
): Promise<void> {
  await request.delete(`/booking/${id}`, { headers: { Cookie: `token=${token}` } });
}
