import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/routers/chat.ts',
        'src/routers/memory.ts',
        'src/services/chat/chat-service.ts',
        'src/services/chat/system-prompt.ts',
        'src/services/llm/factory.ts',
        'src/services/llm/openai-provider.ts',
        'src/services/memory/**/*.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
