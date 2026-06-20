import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { httpError } from '../middleware/errorHandler.js';

// Request bodies are validated and normalised by Zod in the route layer.
export async function register(req, res) {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw httpError(409, 'An account with this email already exists');
  }

  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();

  const token = signToken(user);
  res.status(201).json({ token, user: user.toSafeJSON() });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.verifyPassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  res.json({ token, user: user.toSafeJSON() });
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}
