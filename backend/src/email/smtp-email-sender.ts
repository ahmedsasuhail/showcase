import { createTransport, type Transporter } from 'nodemailer';
import { EmailDeliveryError } from '../errors.js';
import type { EmailMessage, EmailSender } from './email-sender.js';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
}

type MailTransport = Pick<Transporter, 'sendMail'>;

/** Sends email over SMTP: Mailpit locally, or any SMTP provider (Amazon SES supports SMTP). */
export class SmtpEmailSender implements EmailSender {
  /** Takes the transport so tests can pass a fake one. Use `fromOptions` in the app. */
  constructor(private readonly transport: MailTransport) {}

  static fromOptions({ host, port, secure, user, pass }: SmtpOptions): SmtpEmailSender {
    return new SmtpEmailSender(
      createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
        // Fail in seconds, not minutes, so the customer gets an answer.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      }),
    );
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      // Address objects (not hand-built strings) let nodemailer encode names safely, so input cannot add headers.
      await this.transport.sendMail({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
      });
    } catch (cause) {
      throw new EmailDeliveryError('The SMTP server did not accept the message', { cause });
    }
  }
}
