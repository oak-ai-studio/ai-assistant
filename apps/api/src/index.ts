import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { env } from './config/env';
import { appRouter } from './routers';
import { prisma } from './services/db';
import type { TrpcContext } from './trpc';

const app = express();

app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isLanExpo = /^exp:\/\//.test(origin);

      callback(null, isLocalhost || isLanExpo);
    },
    credentials: true,
  }),
);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ok', db: 'connected' });
  } catch (error) {
    console.error('Health check failed', error);
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

const createContext = ({ req }: { req: Request; res: Response }): TrpcContext => ({
  prisma,
  userId: req.header('x-user-id') ?? null,
});

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`tRPC error on ${path ?? '<no-path>'}:`, error);
    },
  }),
);

app.use((error: Error, _req: Request, res: Response) => {
  console.error('Unhandled server error', error);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`);
});
