import jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  REFRESH_TOKEN_EXPIRES_IN_SECONDS,
} from './constants';

type TokenType = 'access' | 'refresh';

type JwtPayload = {
  sub: string;
  type: TokenType;
  iat?: number;
  exp?: number;
};

export function signAccessToken(userId: string): string {
  return signToken(userId, 'access', ACCESS_TOKEN_EXPIRES_IN_SECONDS);
}

export function signRefreshToken(userId: string): string {
  return signToken(userId, 'refresh', REFRESH_TOKEN_EXPIRES_IN_SECONDS);
}

export function verifyAccessToken(token: string): { userId: string } | null {
  const payload = verifyToken(token, 'access');

  if (!payload) {
    return null;
  }

  return {
    userId: payload.sub,
  };
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  const payload = verifyToken(token, 'refresh');

  if (!payload) {
    return null;
  }

  return {
    userId: payload.sub,
  };
}

export function extractBearerToken(authorizationHeader?: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const matched = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!matched?.[1]) {
    return null;
  }

  return matched[1].trim();
}

export function getUserIdFromAccessToken(token: string): string | null {
  return verifyAccessToken(token)?.userId ?? null;
}

function signToken(userId: string, type: TokenType, expiresInSeconds: number): string {
  return jwt.sign(
    {
      sub: userId,
      type,
    },
    getJwtSecret(),
    {
      expiresIn: expiresInSeconds,
    },
  );
}

function verifyToken(token: string, expectedType: TokenType): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (typeof decoded !== 'object' || decoded === null) {
      return null;
    }

    const payload = decoded as JwtPayload;

    if (payload.type !== expectedType || typeof payload.sub !== 'string') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  return secret;
}
