import { describe, expect, it, vi } from 'vitest';
import { userRouter } from './user';

describe('userRouter', () => {
  it('me returns current user profile', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'user-1',
      phone: '13800138000',
      onboardingCompleted: false,
    });

    const caller = userRouter.createCaller({
      userId: 'user-1',
      prisma: {
        user: {
          findUnique,
        },
      },
    } as never);

    const result = await caller.me();

    expect(result.user).toEqual({
      id: 'user-1',
      phone: '13800138000',
      onboardingCompleted: false,
    });
  });

  it('completeOnboarding updates onboardingCompleted flag', async () => {
    const update = vi.fn().mockResolvedValue({
      id: 'user-1',
      phone: '13800138000',
      onboardingCompleted: true,
    });

    const caller = userRouter.createCaller({
      userId: 'user-1',
      prisma: {
        user: {
          update,
        },
      },
    } as never);

    const result = await caller.completeOnboarding();

    expect(update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { onboardingCompleted: true },
      select: {
        id: true,
        phone: true,
        onboardingCompleted: true,
      },
    });
    expect(result.user.onboardingCompleted).toBe(true);
  });

  it('me throws unauthorized when user does not exist', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);

    const caller = userRouter.createCaller({
      userId: 'user-1',
      prisma: {
        user: {
          findUnique,
        },
      },
    } as never);

    await expect(caller.me()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });
});
