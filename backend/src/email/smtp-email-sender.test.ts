import { describe, expect, it, vi } from 'vitest';
import { EmailDeliveryError } from '../errors.js';
import type { EmailMessage } from './email-sender.js';
import { SmtpEmailSender } from './smtp-email-sender.js';

const message: EmailMessage = {
  to: 'sales@test.example',
  from: 'Shop <no-reply@test.example>',
  replyTo: { name: 'Ada', address: 'ada@example.com' },
  subject: 'Product enquiry: Jacket',
  text: 'Hello',
};

describe('SmtpEmailSender', () => {
  it('passes the message to the SMTP transport, with the reply-to as an address object', async () => {
    const sendMail = vi.fn().mockResolvedValue({});

    await new SmtpEmailSender({ sendMail }).send(message);

    expect(sendMail).toHaveBeenCalledWith({
      from: 'Shop <no-reply@test.example>',
      to: 'sales@test.example',
      replyTo: { name: 'Ada', address: 'ada@example.com' },
      subject: 'Product enquiry: Jacket',
      text: 'Hello',
    });
  });

  it('turns any transport failure into an EmailDeliveryError', async () => {
    const sendMail = vi.fn().mockRejectedValue(new Error('ECONNREFUSED 127.0.0.1:1025'));

    await expect(new SmtpEmailSender({ sendMail }).send(message)).rejects.toBeInstanceOf(EmailDeliveryError);
  });
});
