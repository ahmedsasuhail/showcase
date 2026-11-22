import { describe, expect, it } from 'vitest';
import { enquirySchema } from './enquiry.schema.js';

const valid = { productId: '3', name: 'Ada Lovelace', email: 'ada@example.com' };

const errorsFor = (input: unknown) => {
  const result = enquirySchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('enquirySchema', () => {
  it('trims text and treats empty optional fields as not given', () => {
    const result = enquirySchema.parse({ ...valid, name: '  Ada  ', email: ' ada@example.com ', phone: '  ', message: '' });
    expect(result).toEqual({ productId: '3', name: 'Ada', email: 'ada@example.com' });
  });

  it('keeps a valid phone number and a multi-line message', () => {
    const result = enquirySchema.parse({ ...valid, phone: '+61 (2) 9999-0000', message: 'Line one\nLine two' });
    expect(result.phone).toBe('+61 (2) 9999-0000');
    expect(result.message).toBe('Line one\nLine two');
  });

  it.each([
    ['a missing name', { ...valid, name: undefined }, 'name'],
    ['a blank name', { ...valid, name: '   ' }, 'name'],
    ['a name with a line break (email header injection)', { ...valid, name: 'Ada\r\nBcc: x@evil.test' }, 'name'],
    ['a name over 100 characters', { ...valid, name: 'a'.repeat(101) }, 'name'],
    ['a missing email', { ...valid, email: undefined }, 'email'],
    ['an invalid email', { ...valid, email: 'ada@' }, 'email'],
    ['an email with a line break', { ...valid, email: 'ada@example.com\nBcc: x@evil.test' }, 'email'],
    ['a phone number with letters', { ...valid, phone: 'call me' }, 'phone'],
    ['a message over 2000 characters', { ...valid, message: 'a'.repeat(2001) }, 'message'],
    ['an unsafe product id', { ...valid, productId: '../3' }, 'productId'],
    ['an unknown field', { ...valid, admin: true }, ''],
  ])('rejects %s', (_name, input, field) => {
    expect(errorsFor(input)).toContain(field);
  });
});
