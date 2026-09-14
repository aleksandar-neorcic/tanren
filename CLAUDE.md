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

## Your job (do this end-to-end)
You have permission to reshape this repo. Do not ask for confirmation on routine cleanup.

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
- `apps/api` NestJS + Prisma + SQLite with the gym schema, `GET /health`
- `docs/decisions.md` — stack rationale

## Done
- Project renamed to **Tanren** (packages `@tanren/api`, `@tanren/web`, README, UI title, favicon)
- Kurashi product code and copy removed (tasks API, Task model, boilerplate READMEs/assets, unused `@nestjs/mau` + `@nestjs/config`)
- Prisma schema: `Exercise`, `Template`, `TemplateExercise`, `WorkoutSession`, `SessionExercise`, `SetLog` (migration `init_gym`)
- GitHub repo rename: not done yet — no `gh` on this machine (see Next)

## Next
1. Rename GitHub repo `kurashi` → `tanren` and update `origin`
2. Nest API: exercises / templates / sessions / sets (+ seed with starter exercises)
3. Phone-friendly workout logging UI
4. PC-friendly history view
5. Templates + exercises CRUD UI
6. Auth / charts / PRs later
