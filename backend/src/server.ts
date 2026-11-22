import { createApp } from './app.js';
import { CatalogueService } from './catalogue/catalogue.service.js';
import { FakeStoreProductSource } from './catalogue/fake-store/fake-store.product-source.js';
import { loadConfig } from './config.js';

// The only place that decides which implementations the app uses.
const config = loadConfig();
const productSource = new FakeStoreProductSource({
  baseUrl: config.FAKE_STORE_BASE_URL,
  timeoutMs: config.FAKE_STORE_TIMEOUT_MS,
});
const app = createApp({ catalogue: new CatalogueService(productSource) });

const server = app.listen(config.PORT, () => {
  console.log(`API listening on port ${config.PORT}`);
});
process.on('SIGTERM', () => server.close());
