import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import Event from './models/Event.js';
import Seat, { SEAT_STATUS } from './models/Seat.js';
import Reservation from './models/Reservation.js';
import User from './models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sortmyscene';

// Build seat numbers like A1..A10, B1..B10 for a given number of rows/cols.
function buildSeatNumbers(rows, cols) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    for (let c = 1; c <= cols; c++) {
      out.push(`${rowLetter}${c}`);
    }
  }
  return out;
}

const EVENTS = [
  {
    name: 'Indie Night Live',
    description: 'An intimate evening of indie bands and acoustic sets.',
    venue: 'The Underground, Mumbai',
    startsAt: new Date('2026-07-15T19:30:00Z'),
    rows: 5,
    cols: 8, // 40 seats
  },
  {
    name: 'Stand-Up Comedy Showcase',
    description: 'Five comics, one mic, zero filters.',
    venue: 'Laugh Factory, Bengaluru',
    startsAt: new Date('2026-08-02T20:00:00Z'),
    rows: 4,
    cols: 6, // 24 seats
  },
  {
    name: 'Symphony Under the Stars',
    description: 'A full orchestra performing film classics.',
    venue: 'Amphitheatre Park, Pune',
    startsAt: new Date('2026-09-10T18:00:00Z'),
    rows: 6,
    cols: 10, // 60 seats
  },
];

async function run() {
  await connectDB(MONGODB_URI);

  console.log('Clearing existing data...');
  await Promise.all([
    Event.deleteMany({}),
    Seat.deleteMany({}),
    Reservation.deleteMany({}),
  ]);

  for (const def of EVENTS) {
    const seatNumbers = buildSeatNumbers(def.rows, def.cols);
    const event = await Event.create({
      name: def.name,
      description: def.description,
      venue: def.venue,
      startsAt: def.startsAt,
      totalSeats: seatNumbers.length,
    });

    await Seat.insertMany(
      seatNumbers.map((seatNumber) => ({
        eventId: event._id,
        seatNumber,
        status: SEAT_STATUS.AVAILABLE,
      }))
    );

    console.log(`Created "${event.name}" with ${seatNumbers.length} seats`);
  }

  // A demo account so the frontend is usable immediately.
  const demoEmail = 'demo@sortmyscene.test';
  await User.deleteOne({ email: demoEmail });
  const demo = new User({ name: 'Demo User', email: demoEmail });
  await demo.setPassword('password123');
  await demo.save();
  console.log(`Created demo user: ${demoEmail} / password123`);

  await mongoose.disconnect();
  console.log('Seed complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
