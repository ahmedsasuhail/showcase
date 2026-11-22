import { z } from 'zod';

const productId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'must contain only letters, digits, - or _');

/** An optional secret: empty counts as not set. */
const optionalSecret = z
  .string()
  .optional()
  .transform((value) => value || undefined);

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  FAKE_STORE_BASE_URL: z.url().default('https://fakestoreapi.com'),
  FAKE_STORE_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(5000),
  CATALOGUE_CURRENCY: z
    .string()
    .regex(/^[A-Z]{3}$/, 'must be a 3-letter ISO 4217 code such as AUD')
    .default('AUD'),
  /** The products the business has chosen as "top rated", shown on the home page in this order. */
  FEATURED_PRODUCT_IDS: z
    .string()
    .default('3,5,11,12,18')
    .transform((list) => list.split(',').map((id) => id.trim()))
    .pipe(z.array(productId).min(1).max(20)),

  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  // "true"/"false" only: z.coerce.boolean() would read the string "false" as true.
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: optionalSecret,
  SMTP_PASS: optionalSecret,
  MAIL_FROM: z.string().min(1).default('Product Catalogue <no-reply@example.com>'),
  SALES_INBOX_EMAIL: z.email().default('sales@example.com'),
});

/** Reads and validates environment variables. Throws one readable error so the app fails fast at startup. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): z.infer<typeof schema> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    throw new Error(`Invalid configuration: ${problems.join('; ')}`);
  }
  return result.data;
}
