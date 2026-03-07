import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'gemini']).default('openai'),
  OPENAI_API_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),
  GEMINI_API_KEY: z.string().default(''),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
