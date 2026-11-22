# Plan

The spec the build works from. Assumptions and cuts are in [DECISIONS.md](DECISIONS.md).

## Goal
A web product catalogue proof of concept that can grow. Customers browse, search and send an enquiry about a product. The product data source, the look and feel and the email provider are all expected to change, so each one sits behind a clear boundary.

## Stack
| Layer | Choice |
|---|---|
| Client | React + TypeScript + Vite, React Router, plain CSS with theme variables |
| Backend | Node.js + TypeScript + Express, zod validation, nodemailer |
| Email | `EmailSender` interface → SMTP → Mailpit locally (Amazon SES later) |
| Data | `ProductSource` interface → Fake Store adapter. No database |
| Tests | Vitest, Supertest (API), React Testing Library (UI) |
| Run | Docker Compose: backend, frontend (nginx), Mailpit |

## Structure
```text
backend/src/
  server.ts             composition root: read config, build adapters, start app
  app.ts                createApp({ catalogue, enquiries }) → Express app
  config.ts             env vars validated with zod; fails fast
  errors.ts             domain errors + error-handling middleware
  catalogue/
    product.ts          Product, Category types
    product-source.ts   ProductSource interface (the port)
    catalogue.service.ts featured, category split, search, lookup
    catalogue.routes.ts
    search.ts           the search rule (every word must match)
    fake-store/         adapter + mapper; the only code that knows Fake Store
  enquiries/
    enquiry.schema.ts   zod schema for the request
    enquiry-email.ts    builds the plain-text email to the sales inbox
    enquiries.service.ts
    enquiries.routes.ts
  email/
    email-sender.ts     EmailSender interface (the port)
    smtp-email-sender.ts
frontend/src/
  api/                  fetch wrapper for relative /api, response types
  pages/                Home, Category, Search, Product, Enquiry, NotFound
  components/           Layout, SearchForm, CategoryNav, ProductGrid, ProductCard, EnquiryForm
  theme.css             brand colours, fonts, spacing in one place
```
Dependencies flow inwards: routes → services → interfaces. Only `server.ts` knows which adapters are used. Tests build the app with in-memory fakes instead.

## API
| Endpoint | Success | Errors |
|---|---|---|
| `GET /api/health` | `{ status: "ok" }` | — |
| `GET /api/products/featured` | `{ items: Product[] }` | 503 |
| `GET /api/products?q=` (1–100 chars) | `{ query, items }` | 400, 503 |
| `GET /api/products/:id` | `Product` | 404, 503 |
| `GET /api/categories` | `{ items: Category[] }` | 503 |
| `GET /api/categories/:slug/products` | `{ category, topRated, additional }` | 404, 503 |
| `POST /api/enquiries` `{ productId, name, email, phone?, message? }` | `201 { enquiryId }` | 400, 413 (body over 10 KB), 422, 503 |

`Product = { id: string, title, description, price, currency, imageUrl, rating: number \| null, category: { slug, name } }`

Errors use one shape: `{ error: { code, message, details? } }`.

## Work order
One step = one commit on `feature/product-catalogue`, containing the code, its tests and passing checks. Steps 2–6 each deliver one acceptance criterion end to end (backend + frontend). Progress is tracked as a checklist in the draft PR description.

1. `chore: scaffold backend and frontend workspaces`: both apps, test runners, root scripts, Fake Store adapter and app shell (layout, search bar, category nav)
2. `feat: home page with featured products`
3. `feat: category pages with top-rated and additional products`
4. `feat: product search`
5. `feat: product details page`
6. `feat: enquiry form with email to sales inbox`
7. `build: docker compose with Mailpit`
8. `docs: finalise README, decisions and AI usage`

If time runs short, cut UI polish first. Never cut an acceptance criterion, the Fake Store boundary, critical-path tests or the submission docs.

## Tests
- Backend unit: Fake Store mapper, search matcher, catalogue service, enquiry email builder.
- Backend API: Supertest against `createApp` with an in-memory `ProductSource` and a recording `EmailSender`; every status code in the table above.
- Frontend: one test per acceptance criterion; `fetch` is mocked and only `/api/*` URLs are allowed.
- No automated test touches the network.
