import { describe, expect, it } from 'vitest';
import { makeProduct } from '../../test/fixtures.js';
import { buildEnquiryEmail } from './enquiry-email.js';

const product = makeProduct({ id: '3', title: 'Mens Cotton Jacket', price: 55.99, currency: 'AUD' });
const settings = { salesInbox: 'sales@test.example', from: 'Shop <no-reply@test.example>' };

describe('buildEnquiryEmail', () => {
  it('addresses the sales inbox, with replies going to the customer', () => {
    const email = buildEnquiryEmail({ productId: '3', name: 'Ada', email: 'ada@example.com' }, product, 'ref-1', settings);

    expect(email.to).toBe('sales@test.example');
    expect(email.from).toBe('Shop <no-reply@test.example>');
    expect(email.replyTo).toEqual({ name: 'Ada', address: 'ada@example.com' });
    expect(email.subject).toBe('Product enquiry: Mens Cotton Jacket');
  });

  it('includes the product, the customer details, the message and the reference', () => {
    const { text } = buildEnquiryEmail(
      { productId: '3', name: 'Ada', email: 'ada@example.com', phone: '0400 000 000', message: 'In large?' },
      product,
      'ref-1',
      settings,
    );

    for (const part of ['Mens Cotton Jacket (ID 3)', 'AUD 55.99', 'Name: Ada', 'Email: ada@example.com', 'Phone: 0400 000 000', 'In large?', 'ref-1']) {
      expect(text).toContain(part);
    }
  });

  it('says when the optional fields were not given', () => {
    const { text } = buildEnquiryEmail({ productId: '3', name: 'Ada', email: 'ada@example.com' }, product, 'ref-1', settings);
    expect(text).toContain('Phone: Not given');
    expect(text).toContain('(No message)');
  });
});
