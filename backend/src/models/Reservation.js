import mongoose from 'mongoose';

export const RESERVATION_STATUS = Object.freeze({
  ACTIVE: 'active',
  BOOKED: 'booked',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
});

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    seatNumbers: { type: [String], required: true },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.ACTIVE,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Reservation', reservationSchema);
