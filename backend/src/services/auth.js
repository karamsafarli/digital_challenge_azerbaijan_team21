import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const ROLES = { PASSENGER: 'PASSENGER', OPERATOR: 'OPERATOR' };

export const hashPassword = (password) => bcrypt.hash(password, 10);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export function signToken(user) {
  return jwt.sign({ role: user.role, name: user.name }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
  });
}

/** Decoded token as { id, role, name }; throws if invalid or expired. */
export function verifyToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  return { id: Number(payload.sub), role: payload.role, name: payload.name };
}

export const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
