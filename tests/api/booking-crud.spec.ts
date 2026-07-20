import { test, expect } from '@playwright/test';
import { makeBookingPayload, getToken, createBooking, deleteBooking } from './helpers/booking';

// Each test creates and cleans up its own booking, so tests can run in any
// order and in parallel against the shared public sandbox.

test.describe('booking CRUD lifecycle', () => {
  test('creating a booking returns an id and echoes every field back', async ({ request }) => {
    const payload = makeBookingPayload();

    const res = await request.post('/booking', { data: payload });
    // This API returns 200 on create, not 201 (verified against the live API).
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(typeof body.bookingid).toBe('number');
    expect(body.booking).toEqual(payload);

    await deleteBooking(request, body.bookingid, await getToken(request));
  });

  test('a created booking can be read back with all fields intact', async ({ request }) => {
    const payload = makeBookingPayload();
    const id = await createBooking(request, payload);

    const res = await request.get(`/booking/${id}`);
    expect(res.status()).toBe(200);
    const booking = await res.json();

    expect(booking.firstname).toBe(payload.firstname);
    expect(booking.lastname).toBe(payload.lastname);
    expect(booking.totalprice).toBe(payload.totalprice);
    expect(booking.depositpaid).toBe(payload.depositpaid);
    expect(booking.bookingdates).toEqual(payload.bookingdates);
    expect(booking.additionalneeds).toBe(payload.additionalneeds);

    await deleteBooking(request, id, await getToken(request));
  });

  test('updating a booking persists the new values', async ({ request }) => {
    const payload = makeBookingPayload();
    const id = await createBooking(request, payload);
    const token = await getToken(request);

    const updated = { ...payload, firstname: `${payload.firstname}Upd`, totalprice: 999 };
    const putRes = await request.put(`/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
      data: updated,
    });
    expect(putRes.status()).toBe(200);
    expect(await putRes.json()).toEqual(updated);

    // Re-read to prove the update persisted, not just that PUT echoed it.
    const getRes = await request.get(`/booking/${id}`);
    expect(await getRes.json()).toEqual(updated);

    await deleteBooking(request, id, token);
  });

  test('deleting a booking makes it unreadable afterwards', async ({ request }) => {
    const id = await createBooking(request, makeBookingPayload());
    const token = await getToken(request);

    const delRes = await request.delete(`/booking/${id}`, {
      headers: { Cookie: `token=${token}` },
    });
    // This API returns 201 on delete rather than 200/204 (verified live).
    expect(delRes.status()).toBe(201);

    // The re-read returning 404 is the actual proof of deletion.
    const getRes = await request.get(`/booking/${id}`);
    expect(getRes.status()).toBe(404);
  });
});
