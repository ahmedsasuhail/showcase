# AI Usage

## Tools and models
| Phase | Tool / model | Effort | Used for |
|---|---|---|---|
| Planning | Claude (Opus 5.5) | High | Analysing the brief, first plan, decisions, agent instructions |
| Scoping review | Claude Code (Opus 5.5) | Medium | Reviewing the first plan against the brief and cutting it down |
| Building | Claude Code (Sonnet 5.5) | High | Steps 1–5 and 7: scaffold, the four catalogue pages, Docker |
| Building | Claude Code (Opus 5.5) | High | Step 6, the enquiry: the only step with a security surface (input validation, email, personal data) |
| Reviewing | Me, plus Claude Code (Opus 5.5) | High | I approved every commit; a final Opus pass checked the whole PR against the brief and finalised the docs |

I picked the model per step by risk: the cheaper model where the work repeated an established pattern, the stronger one where a subtle mistake would matter most.

This table is the accurate record of which model did what. The `Co-Authored-By` lines in the git history name the model that was active when each commit was made, which is not always the one that wrote it.

## Instruction files and spec
- [`AGENTS.md`](AGENTS.md): rules for coding agents (boundaries, scope, when to run checks, git approval).
- [`PLAN.md`](PLAN.md): the spec agents build from.
- [`DECISIONS.md`](DECISIONS.md): assumptions and decisions.

## Key moments
| # | Moment | What it changed |
|---|---|---|
| 1 | I briefed the planning model to act as founding engineer and produce a traceable plan from the brief, without writing code. | Produced the assumptions and the ports-and-adapters design. |
| 2 | The plan felt excessive for the task. I ran a second, independent review against the brief and the 2–3 hour time-box, and made it justify every resource. | Cut the plan down (see below). Swapped NestJS for Express. |
| 3 | I set the build up as one commit per acceptance criterion, each carrying its own tests and passing checks, with nothing committed until I had approved it. | Seven small, reviewable commits; the draft PR's checklist replaced a task board. |
| 4 | For the enquiry, the riskiest step, I chose the stronger model and approved it only after its failure paths had been shown working against a real SMTP server, not only mocks, and I had tried it myself. | The "Thank you only after the email is accepted" rule, header-injection rejection and no personal data in logs were all checked live, not just in tests. |

## Where the AI got it wrong
| # | What the AI did | How it was caught | What I did instead |
|---|---|---|---|
| 1 | **Too much scope.** NestJS with Swagger, rate limiting, a response cache, TanStack Query, Tailwind, CI and a PR template. About 110 KB of planning documents before any code. | I judged it too big for the brief's "small, well-reasoned solution" and ran the scoping review to test each item: is it on the critical path? | Kept the core boundaries (`ProductSource`, `EmailSender`, browser calls only `/api`), Mailpit and Docker Compose. Cut the rest and recorded each cut in DECISIONS.md. Committed docs went from about 110 KB to about 17 KB. |
| 2 | **Too much process.** A private task board, 10 tickets, 6 approval gates, a commit per ticket and a 1,086-line master plan. Very organised, but built for a team on a multi-week project. | Flagged in the scoping review. For one person on a 3-hour task, keeping a board up to date costs more time than the work it tracks. | I dropped the board entirely. Progress is tracked as one commit per feature, plus a checklist in the draft PR, which reviewers can actually see. |
| 3 | **Category "top rated" built from the home page picks.** The 5 products hand-picked for the home page were reused for category pages: a category's "top rated" section showed only the picks that happened to belong to it. Five picks over four categories means one or two top-rated products per category, or none if the picks are not spread out. | Flagged in the scoping review I ran. I checked it against Fake Store's category sizes before accepting it. | Each category now shows its 3 highest-rated products, from the rating Fake Store already provides (DECISIONS.md A2). The home page still uses the hand-picked 5. |
| 4 | **`202 Accepted` for the enquiry endpoint.** 202 means "received, will be processed later", but the email is sent before we respond. | Flagged in the scoping review I ran. | Changed to `201`. |
| 5 | **Node 26 as the runtime.** The plan and `.nvmrc` named Node 26 as the LTS to use. | The toolchain check at the start of the build: `node -v` on my machine reported 24.2. | Switched to Node 24 (LTS), which is what actually runs here. The plan was written from the AI's knowledge, not from the environment it would run in. |
| 6 | **A data-loading bug in the first commit.** The shared `useApi` hook kept the previous page's data when its URL changed, so moving between categories would have shown the old category's products, and kept showing them if the new request failed. All tests passed. | The review I ran on the first commit, before approving it. | Fixed before that commit, with a test that pins the behaviour. Would otherwise have surfaced on the category pages. |
| 7 | **An unsafe clean-up command.** To stop the test servers it started, the agent ran `taskkill /IM node.exe`, which kills every Node process on the machine. | Blocked by Claude Code's permission guard. | It now starts and stops only its own child processes. |
| 8 | **Verification evidence from the wrong process.** During the enquiry checks the backend's log lines never appeared. My own `npm run dev` server was still running on port 3000 and, because it hot-reloads, it was answering some of the agent's test requests with the same code. | The missing log lines: instead of assuming, the agent checked which process owned the port. | Live checks now run on a private port. The results stood, but the evidence now comes from the process being tested. |

## Course corrections
- **Checks per commit, not per edit.** The agent was set to run lint, typecheck, tests and build after every change. I made full checks mandatory once per commit (each commit = code + tests + passing checks), and mid-step only for core or large changes. Same bar for what gets committed, a fraction of the time and tokens.
- **Lean agent instructions.** `AGENTS.md` is sent with every request, so I cut it to rules only (about 27% smaller, no rules lost) and kept the plan as a file read once per session, not on every prompt.

## Verification
Run from the repo root before every commit; final results:

| Check | Result |
|---|---|
| `npm run lint` | Clean |
| `npm run typecheck` | Clean (both apps) |
| `npm test` | Backend 108 passed, frontend 45 passed; no test touches the network. Line coverage about 93% backend, 97% frontend (the gaps are startup wiring, checked by live runs) |
| `npm run build` | Both apps build |
| `grep -ri fakestoreapi frontend/src` | Nothing: the frontend never references Fake Store |
| `docker compose up --build` | No-cache build about 10 s on my machine; all services healthy about 16 s after starting |

Checked live, beyond the automated tests:
- Every page and endpoint against the real Fake Store, through nginx in the Compose stack.
- Enquiries against a real SMTP server (Mailpit): the email arrives with the customer as Reply-To. With SMTP down the API answers 503 within about 1.5 s and the customer sees no "Thank you". A name containing a line break (header injection) is rejected before sending. Logs carry only the enquiry and product IDs.
- I ran the app myself at the key points (after the scaffold, the enquiry and the Docker setup) before approving those commits.
