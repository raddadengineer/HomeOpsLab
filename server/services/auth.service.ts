import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'fallback_development_secret_change_in_production';

export class AuthService {
  generateToken(payload: object, expiresIn: SignOptions['expiresIn'] = '7d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
