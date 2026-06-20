import mongoose from 'mongoose';

export const SEAT_STATUS = Object.freeze({
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  BOOKED: 'booked',
});

const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    seatNumber: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.AVAILABLE,
      index: true,
    },
    // The reservation currently holding this seat (if reserved).
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
    // When the current hold expires (mirrors the reservation expiry for fast checks).
    reservedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// A seat number is unique within an event.
seatSchema.index({ eventId: 1, seatNumber: 1 }, { unique: true });

export default mongoose.model('Seat', seatSchema);
