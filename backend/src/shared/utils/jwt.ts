import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

const accessSecret = process.env.JWT_SECRET as Secret | undefined;
const refreshSecret = process.env.JWT_REFRESH_SECRET as Secret | undefined;

if (!accessSecret || !refreshSecret) {
  throw new AppError('JWT secrets nao configurados', 500);
}

export const signAccessToken = (payload: object): string =>
  jwt.sign(payload, accessSecret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'],
  });

export const signRefreshToken = (payload: object): string =>
  jwt.sign(payload, refreshSecret, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string) => jwt.verify(token, accessSecret);
export const verifyRefreshToken = (token: string) => jwt.verify(token, refreshSecret);
