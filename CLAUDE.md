# Kurashi — project brief for AI assistants

## What this is
Kurashi is an ongoing personal life app (not a disposable demo).
English-first UI, Japanese i18n later.
Private GitHub repo: aleksandar-neorcic/kurashi

Long-term vision: life OS with modular packs (Japan life, job hunt, JLPT).
**v1 focus: tasks** (todo list the owner will actually use). Packs come after auth + tasks work.

## Stack
- Monorepo: `apps/web` + `apps/api` (keep one repo, do not split)
- Web: React + TypeScript + Vite + Tailwind v4 (`@tailwindcss/vite`)
- API: NestJS (CJS + Jest) + Prisma + SQLite
- Package manager: npm only
- Node: **22** (see `.nvmrc`). Dubai/other projects may use Node 20 via nvm — do not change global default casually.
- Docker: later, after auth + tasks work locally. Owner is new to writing Dockerfiles.

## Already done
- Scaffold web + api
- Tailwind wired in web
- Prisma SQLite with `Task` model + migration `init_tasks`
- Nest modules: `PrismaModule`, `TasksModule`
- Endpoints:
  - `GET /tasks`
  - `POST /tasks` body `{ "title": string }`
  - `PATCH /tasks/:id/done` body `{ "done": boolean }`
- CORS enabled for `http://localhost:5173`
- `import "dotenv/config"` in `apps/api/src/main.ts`
- `.env` is gitignored; DB files `*.db` gitignored
- Prisma pinned to v6 with `--legacy-peer-deps` when npm arborist bugs appear

## Run locally
```bash
cd kurashi && nvm use   # Node 22

# API
cd apps/api
npm run start:dev       # http://localhost:3000

# Web
cd apps/web
npm run dev             # http://localhost:5173
```

DATABASE_URL example in `apps/api/.env`:
`DATABASE_URL="file:./dev.db"`
(DB file lives under `apps/api/prisma/dev.db` from migrate.)

## Next priorities (in order)
1. React tasks UI (list, add, mark done) calling the API
2. Auth (email/password) so data is per-user
3. Due dates in UI + filter Today / Later / Done
4. Japan checklist pack (hardcoded items first)
5. i18n (`en` / `ja`) with react-i18next — English strings first, ja.json can be partial
6. Docker Compose (web + api) as a learning step
7. Optional AI "what should I do this week" later — not day one

## Conventions
- Prefer small commits; do not commit `.env`, secrets, or `*.db`
- Keep Nest layered: controller → service → Prisma
- Prefer simple, readable code over clever abstractions
- Owner is strong with Angular/Laravel; newer to React + Nest — explain briefly when introducing new patterns
- Writing style for product copy later: avoid em dashes and colon-heavy AI tone (owner preference)

## Owner context (useful, not for hardcoding into UI yet)
- Lives in Tokyo (Bunkyo) since June 2025, ARC Japanese school, targeting JLPT N2 Dec 2026
- Job hunting Tokyo frontend / fullstack; Kurashi is also a portfolio project
- Using Claude for continued coding to save other assistant quota for job hunt

## Do not
- Rewrite the monorepo into two repos
- Switch to yarn/pnpm without asking
- Add heavy UI kits before a simple Tailwind tasks screen works
- Force Postgres before Docker/deploy phase
- Run `npm audit fix --force` casually

## Code review checklist (do not skip)

Before saying a feature is done, self-review against this list. These are patterns that often get missed:

### Correctness / edge cases
- Blank vs whitespace-only input (`trim()` where empty should mean empty)
- Disable or block submit while a request is in flight (`isSubmitting`) to prevent double submits
- Clear previous error/success state at the start of a new submit/action
- Handle all relevant API failure shapes, not only the happy-path status code (e.g. same business error may arrive on 400 or 422; check response body codes/fields too)
- Relative paths / env loading: confirm `.env` is actually loaded at runtime, not only by CLI tools
- After schema/client changes, regenerate Prisma client and verify the server still boots

### UX / API contract
- Keep client-side validation errors visually and logically separate from server/API errors
- Show validation feedback as the user types when that is the product requirement; hide rules that already pass
- Exact user-facing copy matters when specified — do not paraphrase error strings
- Loading and empty states: list screens should handle `[]` and in-flight fetches cleanly

### Accessibility (when building forms/UI)
- Inputs need correct accessible names (visible `<label htmlFor>` / `id`, or equivalent)
- Use `aria-invalid` when a field failed validation (including after submit attempt for empty required fields)
- Prefer native buttons/forms with explicit `onSubmit` / `preventDefault` over click-only hacks

### Nest / React specifics for Kurashi
- Controller stays thin; validation and DB logic live in the service (or pipes/DTOs when added)
- Prefer typed DTO/`@Body()` objects over picking a single field if the body might be missing/partial
- CORS, dotenv, and `DATABASE_URL` must work for both `npm run start:dev` and manual curl/fetch tests
- Do not commit `.env`, secrets, or `*.db`

### Definition of done
A task is not done until:
1. It runs locally without manual patching
2. Happy path was tested (curl or UI)
3. At least one failure/empty/invalid path was tested
4. `git status` was checked so junk files are not staged
