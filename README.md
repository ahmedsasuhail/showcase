# Product Catalogue PoC

> **Status: proof of concept complete.** All five acceptance criteria work end to end; every command below has been run.

A proof of concept for a product catalogue. Customers browse and search products and send an enquiry about one. It is built as a foundation that keeps working when the product data source, the look and feel and the email provider change.

Product data comes from the public [Fake Store API](https://fakestoreapi.com) through the backend. The browser never calls it.

## Features
| Feature | Behaviour |
|---|---|
| Home | Shows the 5 products the business chose as "top rated" |
| Category | Shows that category's top-rated products, then the rest |
| Search | Shows only products whose title, description or category contains every search word |
| Product | Clicking a product tile opens its details page |
| Enquiry | **Enquire** opens a contact form. Submitting emails the sales inbox and shows "Thank you" |

Assumptions behind each are in [DECISIONS.md](DECISIONS.md).

## Stack and why
| Layer | Choice | Why |
|---|---|---|
| Client | React + TypeScript (Vite) | Runs in any browser with no simulator. The static build deploys anywhere. |
| Backend | Node.js + TypeScript (Express) | Small and familiar. The data source and email provider sit behind plain interfaces, so swapping either is one new adapter. |
| Email | SMTP to Mailpit locally | A real inbox you can open, with no accounts. Production can point SMTP at Amazon SES. |
| Run | Docker Compose | One command starts the app, the API and the inbox. |

```mermaid
flowchart LR
  browser([Browser]) --> spa[React app]
  spa -->|/api| api[Express API]
  api -->|ProductSource| fs[(Fake Store API)]
  api -->|EmailSender / SMTP| mail[Mailpit or SES]
```

## Getting started
### With Docker (recommended)
Needs Docker with Compose. One command starts the frontend, the backend and the email inbox:
```sh
docker compose up --build
```
- App: http://localhost:8080
- Sales inbox (Mailpit): http://localhost:8025. Enquiry emails arrive here.

It uses host ports 8080, 8025 and 1025; if one is taken, stop whatever is using it. Stop everything with `docker compose down`.

No configuration needed; defaults work locally. To change settings (featured products, sales inbox address), copy `backend/.env.example` to `backend/.env` and edit it, then run the command again. The frontend has no settings: it only calls `/api` on its own origin.

### Without Docker (for development)
Needs Node.js 24 (`.nvmrc`). Run everything from the repo root (the folder with the root `package.json`). Install once, then run each of the other three commands in its own terminal:
```sh
npm install
docker compose up mailpit     # email inbox only
npm run dev -w backend        # API on http://localhost:3000
npm run dev -w frontend       # app on http://localhost:5173, forwards /api to the backend
```
On Windows PowerShell, if `npm` is blocked by the execution policy, use `npm.cmd`, Command Prompt or Git Bash.

### Tests and checks
```sh
npm test            # backend and frontend; no test touches the network
npm run lint
npm run typecheck
npm run build
```

## Where things live
| To change... | Edit |
|---|---|
| The product data source | Write a class implementing `ProductSource` (`backend/src/catalogue/product-source.ts`) and use it in `backend/src/server.ts` |
| The email provider | Write a class implementing `EmailSender` (`backend/src/email/email-sender.ts`), or point the SMTP settings at Amazon SES |
| The look and feel | `frontend/src/theme.css` (colours, fonts, spacing) |
| The featured products | `FEATURED_PRODUCT_IDS` in `backend/.env` |
| The search rule | `backend/src/catalogue/search.ts` |

Full structure and API contract: [PLAN.md](PLAN.md#structure).

## Time spent
| Phase | Minutes |
|---|---:|
| Planning (first plan 35–40, scoping review 15–20) | 50–60 |
| Building | 70–75 |
| Testing | 10–15 |
| Reviewing | 20–25 |
| Misc: light UI polish, code comments, one extra test | 15–20 |
| **Total** | **165–195** |

Slightly over the 2–3 hour time-box at the top end; most of the extra went into review and polish after the five criteria were working.

## Documents
| File | Purpose |
|---|---|
| [PLAN.md](PLAN.md) | Spec: structure, API, work order, tests |
| [DECISIONS.md](DECISIONS.md) | Assumptions, cuts, growth path, next steps |
| [AI_USAGE.md](AI_USAGE.md) | How AI was used and checked |
| [AGENTS.md](AGENTS.md) | Instructions for AI coding agents |
