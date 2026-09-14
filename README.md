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
npm run start:dev

# Web (other terminal)
cd apps/web
npm install
npm run dev
```

- API: http://localhost:3000
- Web: http://localhost:5173

## Docs for AI / contributors

- `CLAUDE.md` — project brief, done / next
- `docs/decisions.md` — why these stack choices

## Notes

- Never commit `.env` or `*.db`
- Private repo for now
