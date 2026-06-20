import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Seat, { SEAT_STATUS } from '../models/Seat.js';
import Reservation, { RESERVATION_STATUS } from '../models/Reservation.js';
import { httpError } from '../middleware/errorHandler.js';
import { releaseExpiredHolds } from '../services/seatService.js';

const RESERVATION_MINUTES = Number(process.env.RESERVATION_MINUTES || 10);

/**
 * POST /api/reserve
 * body: { eventId, seatNumbers: [] }  (validated + de-duplicated by Zod)
 *
 * Double-booking prevention: each seat is flipped available -> reserved with a
 * single atomic findOneAndUpdate guarded by `status: available`. MongoDB
 * guarantees only one concurrent writer wins per document, so two users can
 * never reserve the same seat. If any seat in the batch is unavailable we roll
 * back the seats already grabbed in this request and return 409.
 */
export async function reserveSeats(req, res) {
  const { eventId, seatNumbers } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    throw httpError(404, 'Event not found');
  }

  // Free up anything whose hold lapsed before we try to grab seats.
  await releaseExpiredHolds(eventId);

  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
  const reservationId = new mongoose.Types.ObjectId();
  const grabbed = [];

  for (const seatNumber of seatNumbers) {
    const updated = await Seat.findOneAndUpdate(
      { eventId, seatNumber, status: SEAT_STATUS.AVAILABLE },
      {
        $set: {
          status: SEAT_STATUS.RESERVED,
          reservationId,
          reservedUntil: expiresAt,
        },
      },
      { new: true }
    );

    if (!updated) {
      // Roll back everything we grabbed in this request, then report.
      await Seat.updateMany(
        { eventId, reservationId },
        { $set: { status: SEAT_STATUS.AVAILABLE, reservationId: null, reservedUntil: null } }
      );

      // Distinguish "doesn't exist" from "already taken".
      const seatDoc = await Seat.findOne({ eventId, seatNumber }).select('status').lean();
      if (!seatDoc) {
        throw httpError(404, `Seat ${seatNumber} does not exist for this event`);
      }
      throw httpError(
        409,
        `Seat ${seatNumber} is no longer available. Please pick different seats.`
      );
    }
    grabbed.push(seatNumber);
  }

  const reservation = await Reservation.create({
    _id: reservationId,
    userId: req.user._id,
    eventId,
    seatNumbers: grabbed,
    status: RESERVATION_STATUS.ACTIVE,
    expiresAt,
  });

  res.status(201).json({
    reservationId: reservation._id,
    eventId,
    seatNumbers: grabbed,
    expiresAt,
    secondsRemaining: Math.max(0, Math.round((expiresAt - Date.now()) / 1000)),
  });
}
