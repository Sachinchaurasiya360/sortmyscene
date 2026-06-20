import { z } from 'zod';
import mongoose from 'mongoose';

// A Mongo ObjectId passed as a string.
const objectId = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), { message: 'must be a valid id' });

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  email: z.email('a valid email is required').trim().toLowerCase(),
  password: z.string().min(6, 'password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.email('a valid email is required').trim().toLowerCase(),
  password: z.string().min(1, 'password is required'),
});

export const reserveSchema = z.object({
  eventId: objectId,
  seatNumbers: z
    .array(z.string().trim().min(1, 'seat numbers cannot be empty'))
    .min(1, 'seatNumbers must be a non-empty array')
    // De-duplicate before enforcing the cap so "A1,A1" counts once.
    .transform((arr) => [...new Set(arr)])
    .refine((arr) => arr.length <= 10, { message: 'you can reserve at most 10 seats at once' }),
});

export const bookingSchema = z.object({
  reservationId: objectId,
});

export const eventIdParamSchema = z.object({
  id: objectId,
});
