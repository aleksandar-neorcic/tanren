# Kurashi

## What I want
Kurashi is an ongoing personal life app for living and working in Japan (not a one-off demo).

- English-first UI, Japanese i18n later
- Private GitHub repo: aleksandar-neorcic/kurashi
- Long-term: life app with modular packs (Japan life, job hunt, JLPT)
- v1 focus: tasks (a todo list I will actually use). Packs come after auth + tasks work.

## Stack
- Monorepo: `apps/web` + `apps/api`
- Web: React + TypeScript + Vite + Tailwind
- API: NestJS + Prisma + SQLite
- npm, Node 22 (`.nvmrc`)
- Docker later, after auth + tasks work locally

## Done
- Scaffold web + api
- Tailwind on web
- Prisma SQLite with `Task` model + migration
- Nest tasks API:
  - `GET /tasks`
  - `POST /tasks` with `{ "title": string }`
  - `PATCH /tasks/:id/done` with `{ "done": boolean }`
- CORS for `http://localhost:5173`
- Docs: README, `.env.example`, `docs/decisions.md`

## Next
1. React tasks UI (list, add, mark done) calling the API
2. Auth (email/password)
3. Due dates in UI + Today / Later / Done filters
4. Japan checklist pack (hardcoded items first)
5. i18n (`en` / `ja`)
6. Docker Compose (web + api)
7. Optional AI weekly plan later
