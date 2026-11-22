import type { Product } from '../catalogue/product.js';
import type { EmailMessage } from '../email/email-sender.js';
import type { Enquiry } from './enquiry.schema.js';

export interface EnquiryEmailSettings {
  salesInbox: string;
  from: string;
}

/** The email the sales inbox receives. Plain text; replying goes straight to the customer. */
export function buildEnquiryEmail(
  enquiry: Enquiry,
  product: Product,
  enquiryId: string,
  settings: EnquiryEmailSettings,
): EmailMessage {
  const text = [
    'A customer has sent an enquiry.',
    '',
    `Product: ${product.title} (ID ${product.id})`,
    `Price: ${product.currency} ${product.price.toFixed(2)}`,
    '',
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    `Phone: ${enquiry.phone ?? 'Not given'}`,
    '',
    'Message:',
    enquiry.message ?? '(No message)',
    '',
    `Enquiry reference: ${enquiryId}`,
  ].join('\n');

  return {
    to: settings.salesInbox,
    from: settings.from,
    replyTo: { name: enquiry.name, address: enquiry.email },
    subject: `Product enquiry: ${product.title}`,
    text,
  };
}
