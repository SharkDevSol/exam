import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  role: 'student';
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for students (stateless authentication)
 */
export function generateJWT(userId: string, role: 'student'): string {
  return jwt.sign(
    { userId, role } as JWTPayload,
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWT(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}
