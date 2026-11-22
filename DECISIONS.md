# Decisions and Assumptions

## Assumptions
Where the acceptance criteria leave gaps.

| # | Topic | Assumption |
|---|---|---|
| A1 | "I have chosen 5 products to be top rated" | The business picks them. Product IDs live in config (`FEATURED_PRODUCT_IDS`) and show in that order. They are not computed, because the brief says *chosen*. |
| A2 | Category "top rated" and "additional" | Top rated = the 3 highest-rated products in that category (Fake Store `rating.rate`). Additional = the rest. No product appears in both. The category criterion does not say "chosen", and this way every category has both sections (Fake Store's smallest category has 4 products). |
| A3 | Categories | Come from the data source and show as navigation links. URLs use slugs (`mens-clothing`). |
| A4 | Search | Case-insensitive. Every word of the term must appear in the title, description or category name. Searches the whole catalogue. A blank term is not submitted. |
| A5 | Enquiry contact details | Name and email required; phone and message optional. The product is attached automatically. |
| A6 | Sales inbox | Configurable address (`SALES_INBOX_EMAIL`). Locally, Mailpit catches the email and shows it in a web inbox. |
| A7 | When to show "Thank you" | Only after the email provider accepts the message. On failure the customer sees an error and keeps what they typed. |
| A8 | Product images | The browser loads image URLs returned by our API. It never calls the Fake Store **API**. Proxying images adds work with no benefit yet. |
| A9 | Currency | Fake Store has no currency. Prices show as AUD (configurable). |
| A10 | Look and feel | Neutral and accessible. Brand colours and fonts live in one CSS file, ready for the creative work. |
| A11 | IDs | Product IDs are strings in our API, so a future source with non-numeric IDs will not break clients. |

## Dropped or simplified

| Item | Decision | Why |
|---|---|---|
| Admin screen to choose featured products | Config instead | Enough to show the rule inside the time-box. |
| Storing enquiries, queues, retries | Not built; the email is the record | Low volume. A synchronous send keeps the "Thank you" honest. |
| Rate limiting the enquiry endpoint | Not built | Not needed for a local PoC. First thing to add before going public (see Next). |
| Caching Fake Store responses | Not built | 20 products and a local demo. Easy to add inside the adapter without touching anything else. |
| OpenAPI / Swagger | Not built; API table in README | Seven endpoints. The table is enough for now. |
| Pagination, sorting, filters | Not built | 20 products. List responses use `{ items }`, so paging can be added without breaking clients. |
| Browser end-to-end tests, CI | Not built | API and component tests cover each criterion more cheaply. |
| Auth, cart, checkout, cloud deployment | Not built | Not in the brief. The brief asks for AWS *compatibility*, not deployment. |

## Key decisions

| # | Decision | Why | Trade-off |
|---|---|---|---|
| D1 | React + TypeScript + Vite single-page app | The brief prefers React/TS. Runs without a simulator. Static build deploys anywhere (S3 + CloudFront). | No server rendering; not needed yet. |
| D2 | Express + TypeScript, with interfaces passed in through `createApp()` | Small, familiar, little framework code. Replaceable boundaries come from plain interfaces, not a DI framework. | Wiring is manual. Worth revisiting (e.g. NestJS) only when the module count grows. |
| D3 | `ProductSource` interface; Fake Store adapter maps upstream data to our `Product` | The data source will change. Upstream shapes never leave the adapter folder. | Some mapping code. |
| D4 | `EmailSender` interface; SMTP via nodemailer; Mailpit locally | The provider will change. No accounts needed. Amazon SES accepts SMTP. | One extra container locally. |
| D5 | Browser calls only relative `/api` (Vite proxy in dev, nginx in Docker) | No CORS. Same pattern as CloudFront path routing later. | Small nginx config. |
| D6 | Docker Compose for the reviewer run | One command, no local Node needed. Images run on AWS ECS. | Docker required for the easy path. |

## Growing beyond the PoC
- **New data source** (PIM, database, search engine): write one adapter implementing `ProductSource` and change one line in `server.ts`. API, services and UI stay the same. Search is part of the interface, so a real search engine can take it over.
- **New look and feel:** change `theme.css`. Components are few and semantic.
- **New email provider:** write an adapter implementing `EmailSender` (e.g. the SES API with an IAM role), or point the SMTP settings at SES.
- **New clients** (e.g. a mobile app): use the same JSON API.

## What I would do with one more day
- Rate limit and a bot check on enquiries.
- Persist enquiries and send through a queue (SQS + dead-letter queue) so a provider outage loses nothing.
- Playwright smoke tests for the five journeys, run in CI.
- Generate frontend types from an OpenAPI document.
- Deploy: S3 + CloudFront for the app, ECS Fargate for the API, SES, Secrets Manager.
