import { describe, expect, it } from 'vitest';
import { validateEnquiry } from './validateEnquiry';

const valid = { name: 'Ada', email: 'ada@example.com', phone: '', message: '' };

describe('validateEnquiry', () => {
  it('accepts name and email with the optional fields left blank', () => {
    expect(validateEnquiry(valid)).toEqual({});
  });

  it('accepts a valid phone number', () => {
    expect(validateEnquiry({ ...valid, phone: '+61 (2) 9999-0000' })).toEqual({});
  });

  it.each([
    ['a blank name', { name: '   ' }, { name: 'Enter your name.' }],
    ['a long name', { name: 'a'.repeat(101) }, { name: 'Name can be at most 100 characters.' }],
    ['a blank email', { email: '' }, { email: 'Enter your email address.' }],
    ['an invalid email', { email: 'ada@' }, { email: 'Enter a valid email address.' }],
    ['a phone with letters', { phone: 'call me' }, { phone: 'Enter a valid phone number.' }],
    ['a long message', { message: 'a'.repeat(2001) }, { message: 'Message can be at most 2000 characters.' }],
  ])('reports %s', (_name, change, expected) => {
    expect(validateEnquiry({ ...valid, ...change })).toEqual(expected);
  });
});
