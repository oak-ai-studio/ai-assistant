import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  extractBearerToken,
  getUserIdFromAccessToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/services/auth/jwt';

const ORIGINAL_SECRET = process.env.JWT_SECRET;

describe('jwt auth service', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    if (typeof ORIGINAL_SECRET === 'undefined') {
      delete process.env.JWT_SECRET;
      return;
    }

    process.env.JWT_SECRET = ORIGINAL_SECRET;
  });

  it('signs and verifies access token', () => {
    const token = signAccessToken('user-1');
    expect(verifyAccessToken(token)).toEqual({ userId: 'user-1' });
    expect(getUserIdFromAccessToken(token)).toBe('user-1');
  });

  it('signs and verifies refresh token', () => {
    const token = signRefreshToken('user-1');
    expect(verifyRefreshToken(token)).toEqual({ userId: 'user-1' });
  });

  it('returns null when token type does not match expected type', () => {
    const refresh = signRefreshToken('user-1');
    expect(verifyAccessToken(refresh)).toBeNull();
  });

  it('returns null for malformed token', () => {
    expect(verifyAccessToken('invalid-token')).toBeNull();
    expect(getUserIdFromAccessToken('invalid-token')).toBeNull();
  });

  it('extracts bearer token with case-insensitive prefix', () => {
    expect(extractBearerToken('Bearer abc')).toBe('abc');
    expect(extractBearerToken('bearer   xyz')).toBe('xyz');
  });

  it('returns null for empty or non-bearer authorization header', () => {
    expect(extractBearerToken()).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken('Token abc')).toBeNull();
  });

  it('throws when jwt secret is missing during signing', () => {
    delete process.env.JWT_SECRET;
    expect(() => signAccessToken('user-1')).toThrowError('JWT_SECRET is required');
  });
});
