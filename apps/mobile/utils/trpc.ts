import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@ai-assistant/api';

const trpcUrl = process.env.EXPO_PUBLIC_TRPC_URL ?? 'http://localhost:3000/trpc';

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: trpcUrl,
    }),
  ],
});
