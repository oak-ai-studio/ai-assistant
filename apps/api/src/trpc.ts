import { initTRPC } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';

export type TrpcContext = {
  prisma: PrismaClient;
  userId: string | null;
};

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
