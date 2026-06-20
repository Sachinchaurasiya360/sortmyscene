import Seat, { SEAT_STATUS } from '../models/Seat.js';
import Reservation, { RESERVATION_STATUS } from '../models/Reservation.js';

/**
 * Release any holds whose reservation window has elapsed.
 * Runs as a couple of atomic bulk updates so it is safe to call on every
 * read/reserve/book without needing a background job. Scoped to an event
 * when eventId is provided.
 */
export async function releaseExpiredHolds(eventId = null) {
  const now = new Date();
  const seatFilter = {
    status: SEAT_STATUS.RESERVED,
    reservedUntil: { $lte: now },
  };
  if (eventId) seatFilter.eventId = eventId;

  await Seat.updateMany(seatFilter, {
    $set: { status: SEAT_STATUS.AVAILABLE, reservationId: null, reservedUntil: null },
  });

  const resFilter = {
    status: RESERVATION_STATUS.ACTIVE,
    expiresAt: { $lte: now },
  };
  if (eventId) resFilter.eventId = eventId;

  await Reservation.updateMany(resFilter, {
    $set: { status: RESERVATION_STATUS.EXPIRED },
  });
}
