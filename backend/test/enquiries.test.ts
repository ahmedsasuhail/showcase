import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { CatalogueService } from '../src/catalogue/catalogue.service.js';
import type { ProductSource } from '../src/catalogue/product-source.js';
import type { EmailSender } from '../src/email/email-sender.js';
import { EnquiriesService } from '../src/enquiries/enquiries.service.js';
import { FailingEmailSender, FailingProductSource, InMemoryProductSource, RecordingEmailSender } from './fakes.js';
import { makeProduct } from './fixtures.js';

const jacket = makeProduct({ id: '3', title: 'Mens Cotton Jacket' });

function appWith({
  source = new InMemoryProductSource({ products: [jacket] }),
  emailSender = new RecordingEmailSender(),
}: { source?: ProductSource; emailSender?: EmailSender } = {}) {
  const catalogue = new CatalogueService(source, { featuredProductIds: [] });
  const enquiries = new EnquiriesService(
    catalogue,
    emailSender,
    { salesInbox: 'sales@test.example', from: 'Shop <no-reply@test.example>' },
    () => 'enquiry-123',
  );
  return createApp({ catalogue, enquiries });
}

const validEnquiry = {
  productId: '3',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+61 400 000 000',
  message: 'Do you have this in large?',
};

beforeEach(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('POST /api/enquiries', () => {
  it('emails the sales inbox and returns 201 with a reference', async () => {
    const emailSender = new RecordingEmailSender();

    const res = await request(appWith({ emailSender })).post('/api/enquiries').send(validEnquiry);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ enquiryId: 'enquiry-123' });
    expect(emailSender.sent).toHaveLength(1);
    expect(emailSender.sent[0]).toMatchObject({
      to: 'sales@test.example',
      replyTo: { name: 'Ada Lovelace', address: 'ada@example.com' },
      subject: 'Product enquiry: Mens Cotton Jacket',
    });
  });

  it('accepts an enquiry with only the required fields', async () => {
    const res = await request(appWith())
      .post('/api/enquiries')
      .send({ productId: '3', name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(res.status).toBe(201);
  });

  it('returns 400 naming each invalid field, and sends nothing', async () => {
    const emailSender = new RecordingEmailSender();

    const res = await request(appWith({ emailSender }))
      .post('/api/enquiries')
      .send({ ...validEnquiry, name: '  ', email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
    expect(res.body.error.details.map((d: { field: string }) => d.field).sort()).toEqual(['email', 'name']);
    expect(emailSender.sent).toHaveLength(0);
  });

  it.each([
    ['an unknown field', { ...validEnquiry, isAdmin: true }],
    ['a missing body', undefined],
  ])('returns 400 for %s', async (_name, body) => {
    const res = await request(appWith()).post('/api/enquiries').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
  });

  it('returns 400 for a body that is not valid JSON', async () => {
    const res = await request(appWith())
      .post('/api/enquiries')
      .set('Content-Type', 'application/json')
      .send('{"name": "Ada"');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'invalid_request', message: 'The request body could not be read.' } });
  });

  it('returns 413 for a body far larger than an enquiry', async () => {
    const res = await request(appWith())
      .post('/api/enquiries')
      .send({ ...validEnquiry, message: 'x'.repeat(20_000) });
    expect(res.status).toBe(413);
  });

  it('returns 422 for a product that does not exist, and sends nothing', async () => {
    const emailSender = new RecordingEmailSender();

    const res = await request(appWith({ emailSender }))
      .post('/api/enquiries')
      .send({ ...validEnquiry, productId: '999' });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: { code: 'unprocessable', message: 'This product is no longer available.' } });
    expect(emailSender.sent).toHaveLength(0);
  });

  it('returns 503 when the email provider fails, so the customer is never told it worked', async () => {
    const res = await request(appWith({ emailSender: new FailingEmailSender() }))
      .post('/api/enquiries')
      .send(validEnquiry);

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      error: { code: 'email_unavailable', message: 'We couldn’t send your enquiry. Please try again.' },
    });
  });

  it('returns 503 when the product source is down', async () => {
    const res = await request(appWith({ source: new FailingProductSource() }))
      .post('/api/enquiries')
      .send(validEnquiry);
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('product_source_unavailable');
  });

  it('never logs the customer’s personal details', async () => {
    const info = vi.mocked(console.info);
    const warn = vi.mocked(console.warn);

    await request(appWith()).post('/api/enquiries').send(validEnquiry);
    await request(appWith({ emailSender: new FailingEmailSender() })).post('/api/enquiries').send(validEnquiry);

    const logged = JSON.stringify([...info.mock.calls, ...warn.mock.calls]);
    expect(logged).toContain('enquiry-123');
    for (const secret of ['Ada', 'ada@example.com', '400 000', 'large']) {
      expect(logged).not.toContain(secret);
    }
  });
});
