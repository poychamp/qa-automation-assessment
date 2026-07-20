import { test, expect } from '@playwright/test';
import { makeBookingPayload, getToken, createBooking, deleteBooking } from './helpers/booking';

test.describe('booking API rejects invalid requests', () => {
  test('updating with an invalid token is forbidden and leaves data unchanged', async ({
    request,
  }) => {
    const payload = makeBookingPayload();
    const id = await createBooking(request, payload);

    const res = await request.put(`/booking/${id}`, {
      headers: { Cookie: 'token=not-a-real-token' },
      data: { ...payload, firstname: 'ShouldNotStick' },
    });
    expect(res.status()).toBe(403);

    // The booking must be untouched after the rejected write.
    const after = await (await request.get(`/booking/${id}`)).json();
    expect(after.firstname).toBe(payload.firstname);

    await deleteBooking(request, id, await getToken(request));
  });

  test('deleting with an invalid token is forbidden and the booking survives', async ({
    request,
  }) => {
    const id = await createBooking(request, makeBookingPayload());

    const res = await request.delete(`/booking/${id}`, {
      headers: { Cookie: 'token=not-a-real-token' },
    });
    expect(res.status()).toBe(403);

    const stillThere = await request.get(`/booking/${id}`);
    expect(stillThere.status()).toBe(200);

    await deleteBooking(request, id, await getToken(request));
  });

  test('reading a booking id that does not exist returns 404', async ({ request }) => {
    const res = await request.get('/booking/99999999');
    expect(res.status()).toBe(404);
  });

  test('creating a booking without a required field is rejected', async ({ request }) => {
    const { firstname, ...missingFirstname } = makeBookingPayload();

    const res = await request.post('/booking', { data: missingFirstname });
    // The live API responds 500 here rather than a 400 validation error -
    // asserting the observed behavior; the ideal response is a 400 and this
    // would be worth a bug report against a real system.
    expect(res.status()).toBe(500);
  });
});
