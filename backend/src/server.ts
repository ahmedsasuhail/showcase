import { createApp } from './app.js';
import { CatalogueService } from './catalogue/catalogue.service.js';
import { FakeStoreProductSource } from './catalogue/fake-store/fake-store.product-source.js';
import { loadConfig } from './config.js';
import { SmtpEmailSender } from './email/smtp-email-sender.js';
import { EnquiriesService } from './enquiries/enquiries.service.js';

// The only place that decides which implementations the app uses.
const config = loadConfig();

const productSource = new FakeStoreProductSource({
  baseUrl: config.FAKE_STORE_BASE_URL,
  timeoutMs: config.FAKE_STORE_TIMEOUT_MS,
  currency: config.CATALOGUE_CURRENCY,
});
const emailSender = SmtpEmailSender.fromOptions({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  user: config.SMTP_USER,
  pass: config.SMTP_PASS,
});

const catalogue = new CatalogueService(productSource, { featuredProductIds: config.FEATURED_PRODUCT_IDS });
const enquiries = new EnquiriesService(catalogue, emailSender, {
  salesInbox: config.SALES_INBOX_EMAIL,
  from: config.MAIL_FROM,
});
const app = createApp({ catalogue, enquiries });

const server = app.listen(config.PORT, () => {
  console.log(`API listening on port ${config.PORT}`);
});
process.on('SIGTERM', () => server.close());
