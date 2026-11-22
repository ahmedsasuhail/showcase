import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FAKE_STORE_BASE_URL: z.url().default('https://fakestoreapi.com'),
  FAKE_STORE_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(5000),
});

export type Config = z.infer<typeof schema>;

/** Reads and validates environment variables. Throws one readable error so the app fails fast at startup. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid configuration: ${problems.join('; ')}`);
  }
  return result.data;
}
