import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../services/auth/jwt';
import { VERIFICATION_CODE_EXPIRES_IN_MS } from '../services/auth/constants';
import { publicProcedure, router } from '../trpc';

const phoneSchema = z.string().trim().regex(/^1\d{10}$/, '手机号格式不正确');
const codeSchema = z.string().trim().regex(/^\d{6}$/, '验证码格式不正确');

export const authRouter = router({
  sendCode: publicProcedure
    .input(
      z.object({
        phone: phoneSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRES_IN_MS);

      await ctx.prisma.verificationCode.deleteMany({
        where: { phone: input.phone },
      });

      await ctx.prisma.verificationCode.create({
        data: {
          phone: input.phone,
          code,
          expiresAt,
        },
      });

      console.log(`[auth] verification code for ${input.phone}: ${code}`);

      return {
        success: true,
        expiresAt,
      };
    }),

  verifyCode: publicProcedure
    .input(
      z.object({
        phone: phoneSchema,
        code: codeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const verificationCode = await ctx.prisma.verificationCode.findFirst({
        where: {
          phone: input.phone,
          code: input.code,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!verificationCode || verificationCode.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '验证码无效或已过期。',
        });
      }

      const user = await ctx.prisma.user.upsert({
        where: {
          phone: input.phone,
        },
        update: {},
        create: {
          phone: input.phone,
        },
        select: {
          id: true,
          phone: true,
          onboardingCompleted: true,
        },
      });

      await ctx.prisma.verificationCode.deleteMany({
        where: {
          phone: input.phone,
        },
      });

      const accessToken = signAccessToken(user.id);
      const refreshToken = signRefreshToken(user.id);

      return {
        accessToken,
        refreshToken,
        user,
      };
    }),

  refreshToken: publicProcedure
    .input(
      z.object({
        refreshToken: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payload = verifyRefreshToken(input.refreshToken);

      if (!payload) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Refresh token 无效。',
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: {
          id: payload.userId,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '用户不存在。',
        });
      }

      return {
        accessToken: signAccessToken(user.id),
      };
    }),
});

function generateVerificationCode(): string {
  return String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
}
