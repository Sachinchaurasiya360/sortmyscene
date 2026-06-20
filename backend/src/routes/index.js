import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  reserveSchema,
  bookingSchema,
  eventIdParamSchema,
} from '../validation/schemas.js';
import { register, login, me } from '../controllers/authController.js';
import { listEvents, getEvent } from '../controllers/eventController.js';
import { reserveSeats } from '../controllers/reservationController.js';
import { createBooking } from '../controllers/bookingController.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Auth
router.post('/auth/register', validate({ body: registerSchema }), asyncHandler(register));
router.post('/auth/login', validate({ body: loginSchema }), asyncHandler(login));
router.get('/auth/me', requireAuth, asyncHandler(me));

// Events (public reads)
router.get('/events', asyncHandler(listEvents));
router.get('/events/:id', validate({ params: eventIdParamSchema }), asyncHandler(getEvent));

// Reserve + book (require auth)
router.post('/reserve', requireAuth, validate({ body: reserveSchema }), asyncHandler(reserveSeats));
router.post('/bookings', requireAuth, validate({ body: bookingSchema }), asyncHandler(createBooking));

export default router;
