# AI Usage

## Tools and models
| Phase | Tool / model | Effort | Used for |
|---|---|---|---|
| Planning | Claude (Opus 5.5) | High | Analysing the brief, first plan, decisions, agent instructions |
| Scoping review | Claude Code (Opus 5.5) | Medium | Reviewing the first plan against the brief and cutting it down |
| Building | Claude Code (Sonnet 5.5) | High | Implementing each step of PLAN.md with its tests |
| Reviewing | *To fill in* | | |

## Instruction files and spec
- [`AGENTS.md`](AGENTS.md): rules for coding agents (boundaries, scope, when to run checks, git approval).
- [`PLAN.md`](PLAN.md): the spec agents build from.
- [`DECISIONS.md`](DECISIONS.md): assumptions and decisions.

## Key moments
| # | Moment | What it changed |
|---|---|---|
| 1 | I briefed the planning model to act as founding engineer and produce a traceable plan from the brief, without writing code. | Produced the assumptions (A1–A11) and the ports-and-adapters design. |
| 2 | The plan felt excessive for the task. I ran a second, independent review against the brief and the 2–3 hour time-box, and made it justify every resource. | Cut the plan down (see below). Swapped NestJS for Express. |
| 3 | *To fill in during the build* | |

## Where the AI got it wrong
| # | What the AI proposed | How it was caught | What I did instead |
|---|---|---|---|
| 1 | **Too much scope.** NestJS with Swagger, rate limiting, a response cache, TanStack Query, Tailwind, CI and a PR template. About 110 KB of planning documents before any code. | I judged it too big for the brief's "small, well-reasoned solution" and ran the scoping review to test each item: is it on the critical path? | Kept the core boundaries (`ProductSource`, `EmailSender`, browser calls only `/api`), Mailpit and Docker Compose. Cut the rest and recorded each cut in DECISIONS.md. Committed docs went from about 110 KB to about 17 KB. |
| 2 | **Too much process.** A private task board, 10 tickets, 6 approval gates, a commit per ticket and a 1,086-line master plan. Very organised, but built for a team on a multi-week project. | Flagged in the scoping review. For one person on a 3-hour task, keeping a board up to date costs more time than the work it tracks. | I dropped the board entirely. Progress is tracked as one commit per feature, plus a checklist in the draft PR, which reviewers can actually see. |
| 3 | **Category "top rated" built from the home page picks.** The 5 products hand-picked for the home page were reused for category pages: a category's "top rated" section showed only the picks that happened to belong to it. Five picks over four categories means one or two top-rated products per category, or none if the picks are not spread out. | Flagged in the scoping review I ran. I checked it against Fake Store's category sizes before accepting it. | Each category now shows its 3 highest-rated products, from the rating Fake Store already provides (DECISIONS.md A2). The home page still uses the hand-picked 5. |
| 4 | **`202 Accepted` for the enquiry endpoint.** 202 means "received, will be processed later", but the email is sent before we respond. | Flagged in the scoping review I ran. | Changed to `201`. |
| 5 | **Node 26 as the runtime.** The plan and `.nvmrc` named Node 26 as the LTS to use. | The toolchain check at the start of the build: `node -v` on my machine reported 24.2. | Switched `.nvmrc` and the README to Node 24 (LTS), which is what actually runs here. Lesson: the plan was written from the AI's knowledge, not from the environment it would run in. |

## Course corrections
- **Checks per commit, not per edit.** The agent was set to run lint, typecheck, tests and build after every change. I made full checks mandatory once per commit (each commit = code + tests + passing checks), and mid-step only for core or large changes. Same bar for what gets committed, a fraction of the time and tokens.
- **Lean agent instructions.** `AGENTS.md` is sent with every request, so I cut it to rules only (about 27% smaller, no rules lost) and kept the plan as a file read once per session, not on every prompt.

## Verification
*To fill in: commands run and results.*
