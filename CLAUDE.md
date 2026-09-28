# Tanren (鍛錬) — personal gym app

## What I want
A personal gym app I will actually use.

- **Phone-first for logging workouts** in the gym (big tap targets, fast set entry)
- **PC for everything else** (history, templates, PRs, charts, editing exercises)
- One responsive web app (React). Do **not** build React Native / separate mobile app for v1.
- English-first UI. Japanese i18n can wait.
- Same stack as before when useful: React + Vite + TS + Tailwind, NestJS + Prisma + SQLite, npm, Node 22.

Product v1:
1. Exercises + workout templates
2. Start a session from a template (phone)
3. Log sets (weight x reps), mark sets/exercises done
4. Session history (PC-friendly)
5. Auth later is OK if needed; local single-user is fine for first slice

## How to work with me (IMPORTANT)
**I am building this app to learn React and NestJS. Guide me, don't build it for me.**

- I write the application code (Nest modules, React components/pages). You explain concepts, suggest the next small step, point at the relevant file/docs, and review what I wrote — explaining *why*, not just fixing.
- Do not write non-trivial app code unless I explicitly ask for a specific snippet.
- Routine chores are still yours to just do: renames, gitignore, docs, config plumbing, dependency installs.
- The README "API" table is the spec I'm building the API against.

## Original pivot brief (mostly done — see Done)

1. **Rename the project** away from Kurashi to a gym-related name (pick something short and clear, e.g. `setsuke` / `repbook` / `gymlog` — choose one and use it consistently in package names, README, UI title).
2. **Rename the GitHub repo** if possible (`gh repo rename ...`) to match. Update remotes/README links.
3. **Remove Kurashi-specific code and docs** that no longer apply (life-OS packs, Japan checklist framing, old product copy). Keep useful infrastructure (Vite/Nest/Prisma/Tailwind/nvm setup) if it still helps.
4. **Replace the data model**: remove or replace the generic `Task` model with gym models (e.g. Exercise, Template, TemplateExercise, WorkoutSession, SetLog — adjust as needed).
5. **Rebuild API + UI** for the gym v1 above.
6. **Update README** and this `CLAUDE.md` (Done / Next) as you go.
7. **Commit and push** in small clear commits. Never commit `.env` or `*.db`.

## Stack constraints
- Monorepo `apps/web` + `apps/api` (keep one repo)
- npm only, Node 22 (`.nvmrc`)
- SQLite + Prisma for now
- Tailwind for UI
- Docker later, not day one

## Already in the repo
- `apps/web` Vite React TS Tailwind scaffold (placeholder page only)
- `apps/api` NestJS + Prisma + SQLite: gym schema, `GET /health`, `npm run seed` for starter data, global `ValidationPipe`. **`exercises` is the only resource module so far — I'm writing the rest to learn Nest.**
- `apps/web` Vite React TS Tailwind: `vite.config.ts` proxies `/api` → Nest (and exposes on LAN for phone use), `src/api/types.ts` has the API response types, `react-router` installed. **No pages yet — I'm writing those to learn React.**
- `docs/decisions.md` — stack rationale

## Done
- Project renamed to **Tanren** (packages `@tanren/api`, `@tanren/web`, README, UI title, favicon)
- Kurashi product code and copy removed (tasks API, Task model, boilerplate READMEs/assets, unused `@nestjs/mau` + `@nestjs/config`)
- Prisma schema: `Exercise`, `Template`, `TemplateExercise`, `WorkoutSession`, `SessionExercise`, `SetLog` (migration `init_gym`)
- GitHub repo renamed to `aleksandar-neorcic/tanren`; local folder is `~/tanren`
- A first-pass Nest API was built by Claude, then removed in favour of me rebuilding it as a learning exercise (commit 356efc2 has it if a reference is ever needed — prefer not to look)
- Request validation: `class-validator` + `class-transformer` + `@nestjs/mapped-types`, global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) in `main.ts`
- Nest `exercises` module — list (`?includeArchived`), read, create, update, archive. Conventions set here for the modules that follow:
  - controllers do HTTP only (params, query-string parsing); services own Prisma and throw the HTTP exceptions
  - Prisma error codes map to status: `P2002` → 409, `P2025` → 404; anything else rethrown so it stays a 500
  - DTO nulls follow the schema, not optionality: nullable columns use `@IsOptional()` so `null` clears them, non-nullable ones use `@ValidateIf((o) => o.x !== undefined)` so an explicit `null` is a 400
  - `DELETE` soft-archives; `PATCH { archived: false }` restores

## Next (I write, Claude guides)
1. Nest: `templates` module
2. Nest: `sessions` module (start from template, log sets, finish)
3. React: routing + layout (bottom tabs on phone, top nav on PC)
4. React: start-workout + session logging page (phone)
5. React: history, templates, exercises pages (PC)
6. Auth / charts / PRs later
