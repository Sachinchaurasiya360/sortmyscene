import Seat, { SEAT_STATUS } from '../models/Seat.js';
import Reservation, { RESERVATION_STATUS } from '../models/Reservation.js';
import { httpError } from '../middleware/errorHandler.js';
import { releaseExpiredHolds } from '../services/seatService.js';

export async function createBooking(req, res) {
  const { reservationId } = req.body;

  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    throw httpError(404, 'Reservation not found');
  }
  if (reservation.userId.toString() !== req.user._id.toString()) {
    throw httpError(403, 'This reservation belongs to another user');
  }
  if (reservation.status === RESERVATION_STATUS.BOOKED) {
    throw httpError(409, 'This reservation has already been booked');
  }

  // Sweep expiries, then re-check the hold window.
  await releaseExpiredHolds(reservation.eventId);

  if (
    reservation.status !== RESERVATION_STATUS.ACTIVE ||
    reservation.expiresAt.getTime() <= Date.now()
  ) {
    reservation.status = RESERVATION_STATUS.EXPIRED;
    await reservation.save();
    throw httpError(410, 'Your reservation has expired. Please reserve the seats again.');
  }

  // Flip each held seat to booked atomically. Guarded by reservationId so we
  // only book seats this reservation actually still holds.
  const booked = [];
  for (const seatNumber of reservation.seatNumbers) {
    const updated = await Seat.findOneAndUpdate(
      {
        eventId: reservation.eventId,
        seatNumber,
        status: SEAT_STATUS.RESERVED,
        reservationId: reservation._id,
        reservedUntil: { $gt: new Date() },
      },
      { $set: { status: SEAT_STATUS.BOOKED, reservedUntil: null } },
      { new: true }
    );
    if (updated) booked.push(seatNumber);
  }

  if (booked.length !== reservation.seatNumbers.length) {
    
    await Seat.updateMany(
      { eventId: reservation.eventId, seatNumber: { $in: booked }, status: SEAT_STATUS.BOOKED },
      { $set: { status: SEAT_STATUS.AVAILABLE, reservationId: null } }
    );
    reservation.status = RESERVATION_STATUS.EXPIRED;
    await reservation.save();
    throw httpError(
      409,
      'Some seats could not be booked because the reservation lapsed. Please try again.'
    );
  }

  reservation.status = RESERVATION_STATUS.BOOKED;
  await reservation.save();

  res.status(201).json({
    bookingId: reservation._id,
    eventId: reservation.eventId,
    seatNumbers: booked,
    status: 'confirmed',
  });
}
