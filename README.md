# Tanren (鍛錬)

Personal gym app: log workouts on your phone, review everything else on a PC.

- Phone-first workout logging (big tap targets, fast set entry)
- PC-friendly history, templates, and exercise editing
- One responsive React web app + a small NestJS API on SQLite

## Stack

- `apps/web` — React + TypeScript + Vite + Tailwind
- `apps/api` — NestJS + Prisma + SQLite
- Node 22 (see `.nvmrc`)
- npm

## Setup

```bash
git clone git@github.com:aleksandar-neorcic/tanren.git
cd tanren
nvm use   # Node 22

# API
cd apps/api
cp .env.example .env
npm install --legacy-peer-deps
npx prisma migrate dev
npm run seed        # optional: starter exercises + Push/Pull/Legs templates
npm run start:dev

# Web (other terminal)
cd apps/web
npm install
npm run dev
```

- API: http://localhost:3000
- Web: http://localhost:5173

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | liveness |
| GET/POST | `/exercises` | list (`?includeArchived=true`) / create |
| GET/PATCH/DELETE | `/exercises/:id` | read / update / archive |
| GET/POST | `/templates` | list with exercises / create |
| GET/PUT/DELETE | `/templates/:id` | read / replace / delete |
| GET | `/sessions?limit=50` | history, newest first, with set count + volume |
| GET | `/sessions/active` | the unfinished session or `null` |
| POST | `/sessions` | start `{ templateId? , name? }` — sets prefilled from last time |
| GET/PATCH/DELETE | `/sessions/:id` | read / rename+notes / delete |
| POST | `/sessions/:id/finish` | mark finished |
| POST | `/sessions/:id/exercises` | add `{ exerciseId }` mid-session |
| PATCH/DELETE | `/session-exercises/:id` | `{ done }` / remove |
| POST | `/session-exercises/:id/sets` | append a set (copies the previous one) |
| PATCH/DELETE | `/sets/:id` | `{ weight, reps, done }` / remove |

Mutations on a session return the full updated session, so the phone never has to
merge a patch into local state.

- Only one session may be unfinished at a time. Starting a second one is a `409`
  carrying `activeSessionId`, so the client can jump to the live session instead.
- `POST /sessions/:id/finish` is idempotent: a retry over bad gym wifi returns the
  session unchanged rather than re-stamping `finishedAt`.
- Prefill on start: how many sets comes from the template's `targetSets`, the weight
  and reps come from the last finished session for that exercise, falling back to the
  template's own targets when there is no history.
- `setCount` and `volume` in the history list count only sets marked `done`.

```bash
curl -X POST localhost:3000/sessions -H "Content-Type: application/json" -d '{"templateId":"..."}'
curl -X PATCH localhost:3000/sets/SET_ID -H "Content-Type: application/json" -d '{"weight":80,"reps":8,"done":true}'
```

## Docs for AI / contributors

- `CLAUDE.md` — project brief, done / next
- `docs/decisions.md` — why these stack choices

## Notes

- Never commit `.env` or `*.db`
- Private repo for now
