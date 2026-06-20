# SortMyScene:  Event Ticket Booking

A simplified event ticket booking flow focused on **seat reservation** and **booking
confirmation**, built as a MERN stack application (MongoDB, Express, React, Node.js).

Users browse events, pick seats from a colour-coded seat map, **reserve** them for a
10 minute hold (with a live countdown), and then **confirm** the booking before the hold
expires. Double booking is prevented at the database level.

---

## Tech Stack

| Layer     | Tech                                            |
| --------- | ----------------------------------------------- |
| Backend   | Node.js, Express, MongoDB (Mongoose), JWT auth, Zod validation |
| Frontend  | React 18 (Vite), Axios, React Hooks, plain CSS  |
| Auth      | JWT (Bearer token) + bcrypt password hashing    |

---

## How to Run

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # (a ready-to-use .env is already included)
npm run seed                  # creates 3 sample events + a demo user
npm start                     # http://localhost:5000
```

The seed creates a demo account you can log in with immediately:

```
email:    demo@sortmyscene.test
password: password123
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so no extra config
is needed. Open **http://localhost:5173** and sign in with the demo account (the form
is pre-filled).

---

## Different approaches I thought about (the booking-rush problem)

This is basically the real question behind any ticketing app. What happens when a lot of
people try to grab the same seats at the same time? There is no single correct answer here,
it really depends on how many people are hitting the system at once. So here is how i was
thinking about it and the options i considered.

### Approach 1 - Atomic compare-and-set on a single MongoDB (this is what i built)

Each seat is one document. To reserve it we just do one `findOneAndUpdate` that says flip
this seat to reserved ONLY if it is currently available. Mongo makes sure only one writer
wins that flip, so two people can never both get the same seat. Simple, no extra infra, and
it runs on a plain standalone Mongo (no replica set needed).

Where it is good: normal events. A few hundred to a few thousand people booking across a
hall of seats. Most people are fighting for *different* seats anyway, so there is barely any
contention and Mongo just handles it fine.

Where it breaks: when thousands of people all slam the *same* seat (or the same tiny front
row) at the same second, like a hyped concert where everyone wants A1. Now they are all
hammering one single document and Mongo has to do those writes one by one. It stays
*correct*, nobody gets double booked, but it gets slow and people see "seat taken" a lot.
Honestly this design is comfortable up to maybe a few thousand people booking together.
Push it to tens of thousands all at once and the single DB becomes the bottleneck. So yeah,
great for a club night, not really built for a stadium on-sale.

### Approach 2 - MongoDB multi-document transactions

Wrap "reserve all the seats i picked" in one ACID transaction so it is fully
all-or-nothing across multiple seats at once. Cleaner story when someone books 6 seats
together.

The catch: transactions need a replica set (more setup), they are heavier, and under high
contention Mongo throws write-conflict errors that you then have to retry. So you actually
get *worse* throughput under a rush than the simple approach above. Good when correctness
across many docs matters more than raw speed, say a few thousand users, not a flash sale.
I skipped it because for this app the per-seat atomic flip already gives the same guarantee
with less overhead.

### Approach 3 - Redis for the seat holds (the one to use when EVERYONE books at once)

Move the "who is holding which seat" part into Redis instead of the DB. Redis is in-memory
and single threaded, so its atomic ops (or a small Lua script) are perfect for "grab this
seat if free", and it does this insanely fast, roughly 100k+ operations a second on one
node. The 10 minute hold is just a Redis key with a TTL, so expiry is basically free, no
cleanup job needed. Mongo only gets written to when a booking is actually *confirmed*.

This is the approach you go with if you expect a huge crowd hitting at the same instant,
like 1 lakh (100,000) people refreshing for the same show the second tickets drop. Redis
soaks up the stampede and the DB stays calm. The cost is one more moving part (a Redis
server) and you have to keep Redis and Mongo in sync, but for a real high-demand on-sale
this is the standard move.

### Approach 4 - Queue / waiting room (the stadium / IRCTC / BookMyShow scale)

Here you don't even let everyone hit the booking logic directly. You put every request
into a queue (Kafka/SQS) and process them in order, and show users a "you are number 4,312
in line" waiting room. This is how Ticketmaster / IRCTC / BookMyShow survive on-sales with
millions of people.

It basically cannot be overwhelmed because nothing races, requests are handled one at a
time per event. The downside is it is the most complex to build and bookings turn into
"wait your turn" instead of instant. Overkill for anything below massive scale, but it is
the only thing that holds up at millions at once.

### So which one?

- **Small / normal events (what this assignment is):** Approach 1. Simple, correct, zero
  extra infra. This is what is implemented.
- **Lots of people booking at the exact same time (hyped show, big drop ~1 lakh users):**
  Approach 3 (Redis) is the one to reach for. Keep Approach 1's atomic idea, just move the
  hot "seat grab" into Redis so one database is not the choke point.
- **Truly massive on-sale (millions, stadium tours):** Approach 4, the queue + waiting
  room.

Short version: i built Approach 1 because it is the right fit for this scale and it proves
the double-booking guarantee cleanly. If this was a real high-traffic ticketing product,
the upgrade path is Approach 1, then add Redis (3), then add a queue (4) as the crowd
grows.

---

## Design Decisions

### Preventing double booking (the core constraint)

Booking correctness is enforced **in the database**, not in application logic, so it is
safe under concurrent requests:

- **Atomic compare-and-set per seat.** Reserving a seat is a single
  `findOneAndUpdate({ status: 'available' } -> { status: 'reserved' })`. MongoDB guarantees
  that only one concurrent writer can match-and-update a given document, so two users can
  **never** grab the same seat. If any seat in a multi-seat request is already taken, the
  seats already grabbed in that request are rolled back and the API returns `409`.
- **A unique index** on `(eventId, seatNumber)` guarantees seat identity.
- **Booking is guarded too.** Confirming flips `reserved -> booked` only when the seat is
  still held by *this* reservation and `reservedUntil > now`, so a stolen or expired hold
  can never be booked.

This atomic-operation approach was chosen over multi-document transactions because it
works on a **standalone MongoDB** (transactions require a replica set) while still giving
the same correctness guarantee for this use case.

### Expiring reservations

- Each reservation stores `expiresAt` (now + 10 min); each held seat mirrors it in
  `reservedUntil`.
- `releaseExpiredHolds()` runs as a cheap atomic bulk update on every read/reserve/book
  call. Lapsed seats flip back to `available` and the reservation is marked `expired`.
  This avoids needing a separate cron/background worker while keeping state consistent.
- Booking re-checks the expiry window, so an expired reservation returns `410 Gone`.

### Auth

Basic JWT auth: bcrypt-hashed passwords, a Bearer token stored in `localStorage`, an
Axios request interceptor that attaches it, and `requireAuth` middleware protecting the
reserve/book endpoints. Browsing events is public; reserving and booking require a login.

### Input validation

All request bodies and route params are validated with **Zod** at the route layer via a
`validate({ body, params })` middleware, so controllers receive already-clean, typed data
and contain no manual validation. Zod also normalises input (trims/lowercases emails,
de-duplicates `seatNumbers`) and produces consistent field-level `400` messages.

### State management

React Hooks only (`useState`, `useEffect`, `useCallback`) plus a small `AuthContext`.
Component-based architecture: `EventList`, `EventDetail`, `SeatGrid`, `Countdown`,
`AuthForm`. Async calls go through a single Axios instance that normalises the server's
`{ error }` payloads into thrown messages for consistent error handling.

---

## Assumptions

- Seat numbers are generated as a grid (`A1...`, `B1...`) by the seed script; the seat map
  groups them by row letter.
- A single MongoDB instance (standalone) is sufficient, hence atomic operations rather
  than transactions.
- `localStorage` is an acceptable token store for this assignment (a production app would
  consider httpOnly cookies / refresh tokens).
- Reservation hold time is configurable via `RESERVATION_MINUTES` (default 10).
- One reservation is held at a time per user in the UI flow; the backend supports
  multiple independent reservations.
