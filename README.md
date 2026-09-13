# Kurashi

Personal life app for living and working in Japan.

Ongoing project: tasks first, then packs (Japan life, job hunt, JLPT), English UI with Japanese i18n later.

## Stack

- `apps/web` — React + TypeScript + Vite + Tailwind
- `apps/api` — NestJS + Prisma + SQLite
- Node 22 (see `.nvmrc`)
- npm

## Setup

```bash
git clone git@github.com:aleksandar-neorcic/kurashi.git
cd kurashi
nvm use   # Node 22

# API
cd apps/api
cp .env.example .env
npm install --legacy-peer-deps
npx prisma migrate dev
npm run start:dev

# Web (other terminal)
cd apps/web
npm install
npm run dev
```

- API: http://localhost:3000
- Web: http://localhost:5173

## API smoke tests

```bash
curl http://localhost:3000/tasks

curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

curl -X PATCH http://localhost:3000/tasks/TASK_ID/done \
  -H "Content-Type: application/json" \
  -d '{"done":true}'
```

## Docs for AI / contributors

- `CLAUDE.md` — project brief, checklist, footguns, work loop
- `docs/decisions.md` — why these stack choices

## Notes

- Never commit `.env` or `*.db`
- Private repo for now
