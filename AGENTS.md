# Agent rules

Spec: PLAN.md (read once per session). Assumptions: DECISIONS.md; do not reopen without asking.

## Boundaries
- Frontend calls only relative `/api`. No Fake Store reference in `frontend/`.
- Fake Store code only in `backend/src/catalogue/fake-store/`. Upstream data is `unknown` until mapped to `Product`.
- Email only via `EmailSender`. Adapters throw domain errors, not HTTP errors.
- Routes thin: zod-validate, call service, respond.
- Only `server.ts` picks adapters.
- Backend is ESM: relative imports end in `.js`.

## Scope
- Stay inside the current PLAN.md step. Small changes.
- No new dependency, database, queue or infrastructure without approval.
- No speculative abstractions, options or files.

## Commits
- One commit per PLAN.md step: code + tests + passing checks.
- Tests never hit the real network.

## Checks
- While working: run only the relevant test file, when useful.
- Full checks (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`): required before every commit; mid-step only if touching core (`app.ts`, `server.ts`, `config.ts`, ports, shared types) or ~5+ files.
- Before commit: `grep -ri fakestoreapi frontend/src` is empty; self-review AC met, error paths per API table, no secrets, no personal data in logs, accessible markup.
- Report exact commands and results. Never claim an unrun check passed.

## Git
- No commit, push or PR without human approval. Propose a Conventional Commit message.
- Never merge the feature PR into `main`; it stays open for reviewers.
- Never commit `.env` or secrets; use `.env.example`.
