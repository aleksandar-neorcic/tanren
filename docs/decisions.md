# Kurashi decisions

## Monorepo (apps/web + apps/api)
One repo is simpler for a personal project: one clone, shared history, easier Docker later.

## npm
Stick to npm to avoid mixed lockfiles (no yarn/pnpm unless we deliberately migrate).

## Node 22
Nest CLI / tooling expects modern Node. `.nvmrc` pins 22. Other projects can keep Node 20 via nvm.

## SQLite first
Fast local setup, no DB container. Switch to Postgres when Dockerizing/deploying if needed. Prisma makes that migration manageable.

## Prisma v6
Pinned while npm hit arborist bugs on newer installs. Use `--legacy-peer-deps` if installs fail with edgesOut errors.

## Nest CJS + Jest
More tutorials and fewer ESM footguns for learning Nest.

## Tailwind v4
Modern default with Vite via `@tailwindcss/vite`.

## Auth later, tasks first
v1 proves full-stack loop (UI ↔ API ↔ DB). Auth and packs come after list/add/done works.

## Docker later
Learn Dockerfile/compose after the app works locally.

## i18n EN first
Ship English UI with string dictionaries early; Japanese translations can lag without blocking features.
