import { z } from 'zod';

/** Rejects line breaks and other control characters, which have no place in a name. */
const hasNoControlCharacters = (value: string) =>
  [...value].every((char) => {
    const code = char.charCodeAt(0);
    return code >= 32 && code !== 127;
  });

const emptyAsMissing = (value: string) => value || undefined;

/**
 * What a customer sends with an enquiry (assumption A5): name and email required,
 * phone and message optional. Unknown fields are rejected.
 */
export const enquirySchema = z.strictObject({
  productId: z.string('Choose a product.').regex(/^[A-Za-z0-9_-]{1,64}$/, 'Choose a valid product.'),
  name: z
    .string('Enter your name.')
    .trim()
    .min(1, 'Enter your name.')
    .max(100, 'Name can be at most 100 characters.')
    .refine(hasNoControlCharacters, 'Name contains characters that are not allowed.'),
  email: z
    .string('Enter your email address.')
    .trim()
    .min(1, 'Enter your email address.')
    .max(254, 'Email address is too long.')
    .pipe(z.email('Enter a valid email address.')),
  // Optional fields: trimmed, and an empty string counts as not given.
  phone: z
    .string()
    .trim()
    .max(30, 'Phone number can be at most 30 characters.')
    // Deliberately loose: digits plus the usual separators (+ ( ) - . space), 6-30 characters,
    // so local and international formats both pass. Sales staff read it; nothing dials it.
    .refine((value) => value === '' || /^[0-9+()\-.\s]{6,30}$/.test(value), 'Enter a valid phone number.')
    .transform(emptyAsMissing)
    .optional(),
  message: z.string().trim().max(2000, 'Message can be at most 2000 characters.').transform(emptyAsMissing).optional(),
});

export type Enquiry = z.infer<typeof enquirySchema>;
