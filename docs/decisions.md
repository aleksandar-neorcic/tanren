# Tanren decisions

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

## One responsive web app, no React Native
Phone-first layout for logging in the gym, PC layout for history/templates. One codebase, one deploy. Native app only if the web app proves insufficient.

## Single user, no auth in v1
The app runs locally for one person. Auth is added only when it needs to leave localhost.

## Docker later
Learn Dockerfile/compose after the app works locally.

## i18n EN first
English UI now; Japanese translations can come later without blocking features.
