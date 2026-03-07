import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { authRouter } from './auth';
import { signRefreshToken, verifyAccessToken } from '../services/auth/jwt';

function createCaller() {
  const verificationCode = {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
  };

  const user = {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  };

  const caller = authRouter.createCaller({
    prisma: {
      verificationCode,
      user,
    },
    userId: null,
  } as never);

  return {
    caller,
    verificationCode,
    user,
  };
}

describe('authRouter', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.JWT_SECRET;
  });

  it('sendCode stores code and returns expiration', async () => {
    const { caller, verificationCode } = createCaller();
    verificationCode.deleteMany.mockResolvedValue({ count: 0 });
    verificationCode.create.mockResolvedValue({});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await caller.sendCode({ phone: '13800138000' });

    expect(result.success).toBe(true);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(verificationCode.deleteMany).toHaveBeenCalledWith({
      where: { phone: '13800138000' },
    });
    expect(verificationCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        phone: '13800138000',
        code: expect.stringMatching(/^\d{6}$/),
      }),
    });
  });

  it('verifyCode logs in and returns tokens', async () => {
    const { caller, verificationCode, user } = createCaller();
    const expiresAt = new Date(Date.now() + 60_000);

    verificationCode.findFirst.mockResolvedValue({
      id: 'code-1',
      phone: '13800138000',
      code: '123456',
      expiresAt,
      createdAt: new Date(),
    });
    verificationCode.deleteMany.mockResolvedValue({ count: 1 });
    user.upsert.mockResolvedValue({
      id: 'user-1',
      phone: '13800138000',
    });

    const result = await caller.verifyCode({
      phone: '13800138000',
      code: '123456',
    });

    expect(result.user).toEqual({
      id: 'user-1',
      phone: '13800138000',
    });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(verifyAccessToken(result.accessToken)?.userId).toBe('user-1');
  });

  it('verifyCode rejects expired code', async () => {
    const { caller, verificationCode } = createCaller();
    verificationCode.findFirst.mockResolvedValue({
      id: 'code-1',
      phone: '13800138000',
      code: '123456',
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    });

    await expect(
      caller.verifyCode({ phone: '13800138000', code: '123456' }),
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('refreshToken returns a new access token', async () => {
    const { caller, user } = createCaller();
    user.findUnique.mockResolvedValue({ id: 'user-1' });

    const refreshToken = signRefreshToken('user-1');
    const result = await caller.refreshToken({ refreshToken });

    expect(verifyAccessToken(result.accessToken)?.userId).toBe('user-1');
  });

  it('refreshToken rejects invalid token', async () => {
    const { caller } = createCaller();

    await expect(caller.refreshToken({ refreshToken: 'invalid' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
