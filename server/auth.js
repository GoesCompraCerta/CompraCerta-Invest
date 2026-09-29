import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado no .env');
  return secret;
};

export const assertJwtSecret = () => getJwtSecret();

export const hashPassword = (password) => bcrypt.hash(password, 12);

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

export const generateToken = (userId) => jwt.sign(
  { sub: String(userId) },
  getJwtSecret(),
  { expiresIn: '30d' }
);

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());

export const requireAuth = (request) => {
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.authorization || '');
  if (!match) return null;

  try {
    const userId = Number(verifyToken(match[1]).sub);
    return Number.isSafeInteger(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
};
