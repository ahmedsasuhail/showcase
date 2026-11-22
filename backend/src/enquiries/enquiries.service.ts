import { randomUUID } from 'node:crypto';
import type { CatalogueService } from '../catalogue/catalogue.service.js';
import type { Product } from '../catalogue/product.js';
import type { EmailSender } from '../email/email-sender.js';
import { NotFoundError, UnprocessableError } from '../errors.js';
import { buildEnquiryEmail, type EnquiryEmailSettings } from './enquiry-email.js';
import type { Enquiry } from './enquiry.schema.js';

export class EnquiriesService {
  constructor(
    private readonly catalogue: CatalogueService,
    private readonly emailSender: EmailSender,
    private readonly settings: EnquiryEmailSettings,
    private readonly newId: () => string = randomUUID,
  ) {}

  /**
   * Emails the enquiry to the sales inbox. Resolves only once the provider has accepted
   * the message, so the customer never sees "Thank you" for an email that was not sent (A7).
   */
  async submit(enquiry: Enquiry): Promise<{ enquiryId: string }> {
    let product: Product;
    try {
      product = await this.catalogue.getProduct(enquiry.productId);
    } catch (error) {
      if (error instanceof NotFoundError) throw new UnprocessableError('This product is no longer available.');
      throw error;
    }

    const enquiryId = this.newId();
    await this.emailSender.send(buildEnquiryEmail(enquiry, product, enquiryId, this.settings));
    // IDs only: never log the customer's name, email, phone or message.
    console.info(`Enquiry ${enquiryId} sent for product ${product.id}`);
    return { enquiryId };
  }
}
