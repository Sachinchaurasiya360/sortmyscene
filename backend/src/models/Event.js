import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    startsAt: { type: Date, required: true },
    venue: { type: String, required: true, trim: true },
    totalSeats: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('Event', eventSchema);
