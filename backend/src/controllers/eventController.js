import Event from '../models/Event.js';
import Seat, { SEAT_STATUS } from '../models/Seat.js';
import { httpError } from '../middleware/errorHandler.js';
import { releaseExpiredHolds } from '../services/seatService.js';

// GET /api/events
export async function listEvents(req, res) {
  await releaseExpiredHolds();

  const events = await Event.find().sort({ startsAt: 1 }).lean();

  // Attach a live availability count per event.
  const counts = await Seat.aggregate([
    { $match: { status: SEAT_STATUS.AVAILABLE } },
    { $group: { _id: '$eventId', available: { $sum: 1 } } },
  ]);
  const availByEvent = new Map(counts.map((c) => [c._id.toString(), c.available]));

  res.json(
    events.map((e) => ({
      ...e,
      availableSeats: availByEvent.get(e._id.toString()) || 0,
    }))
  );
}

// GET /api/events/:id  -> event details + full seat map
export async function getEvent(req, res) {
  const { id } = req.params; // validated by eventIdParamSchema

  await releaseExpiredHolds(id);

  const event = await Event.findById(id).lean();
  if (!event) {
    throw httpError(404, 'Event not found');
  }

  const seats = await Seat.find({ eventId: id })
    .sort({ seatNumber: 1 })
    .select('seatNumber status')
    .lean();

  // Natural sort so A2 comes before A10.
  seats.sort((a, b) =>
    a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true })
  );

  res.json({ ...event, seats });
}
