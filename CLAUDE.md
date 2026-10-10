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

## Design reference (IMPORTANT for any UI work)
- `docs/design/` is the visual spec. Read `docs/design/README.md` and look at the PNGs in `docs/design/screens/` before suggesting, reviewing, or writing any UI.
- Match its style: black/zinc dark theme with a single lime accent, Session v1 "one exercise at a time" logging, a floating pill tab bar on phone and a left sidebar on PC.
- Logo and favicon assets are in `docs/design/brand/`. When something in the code disagrees with the mockups, point it out instead of silently picking one.

## Stack constraints
- Monorepo `apps/web` + `apps/api` (keep one repo)
- npm only, Node 22 (`.nvmrc`)
- SQLite + Prisma for now
- Tailwind for UI
- Docker later, not day one

## Already in the repo
- `apps/web` Vite React TS Tailwind scaffold (placeholder page only)
- `apps/api` NestJS + Prisma + SQLite: gym schema, `GET /health`, `npm run seed` for starter data, global `ValidationPipe`. The API is feature-complete against the README table (`exercises`, `templates`, `sessions`).
- `apps/web` Vite React TS Tailwind: `vite.config.ts` proxies `/api` → Nest (and exposes on LAN for phone use), `src/api/types.ts` has the API response types, `react-router` routing and the layout shell are in place. **Pages are stubs — the real screens are mine to write.**
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
- Nest `templates` module — list, read, create, replace (`PUT`), delete. Adds to the conventions above:
  - nested child arrays: `@IsArray` + `@ValidateNested({ each: true })` + `@Type(() => Dto)`; without `@Type` the elements are never validated
  - the client sends `exercises` as an ordered array and the server derives `order` from the index, so the two can never disagree
  - `PUT` replaces the whole template in one nested write (`exercises: { deleteMany: {}, create: [...] }`), and an omitted field means "clear it", not "leave it"
  - `P2003` (bad foreign key) → 400; `isPrismaError` now lives in `src/prisma/prisma-error.ts` and is shared
  - hard `DELETE` here, not archive: `Template` has no `archived`, and sessions keep their history via `onDelete: SetNull`
- Nest `sessions` module — written by Claude at my request, unlike the two above. Covers the whole README table: start (from a template or freeform), log sets, add exercises mid-session, finish, history, delete. What it adds to the conventions:
  - three controllers (`/sessions`, `/session-exercises`, `/sets`) in **one** module: child rows are addressed by their own id on flat routes, and every mutation ends by returning the whole session via `SessionsService.getFull`
  - route order matters — `@Get('active')` must be declared above `@Get(':id')` or Nest hands `'active'` to the service as an id
  - returning `null` from a handler sends an **empty body**, not `null`: Nest's Express adapter treats nil as "nothing to send". `/sessions/active` uses `@Res()` + `res.json()` so the web app can still parse it
  - appending derives `order`/`setNumber` from `max + 1`, not an array index the way templates do; gaps left by deletes are fine because reads sort and never assume contiguity
  - invariants the schema cannot hold live in the service: one unfinished session at a time (409 with `activeSessionId`), and `finish` is idempotent so a retry cannot rewrite `finishedAt`
  - derived fields (`setCount`, `volume` over `done` sets only) are computed in JS in `session.include.ts`, next to the include shape they depend on

- React routing + layout shell — written by Claude at my request. Route tree in `apps/web/src/routes.tsx`, chrome in `src/layouts/AppLayout.tsx`, stub pages in `src/pages/`:
  - data mode (`createBrowserRouter` + `RouterProvider`), chosen so adding `loader`s later needs no rewrite of the tree; no loaders yet, data fetching still to come
  - a **pathless layout route** holds the chrome: `AppLayout` renders for every child and the matched page fills its `<Outlet />`, so the nav never remounts on navigation
  - `session/:id` is a **sibling** of the layout, not a child, so the logging screen renders with no tabs to mistap mid-workout — the route tree says which pages have chrome, not a conditional inside the layout
  - one `navItems` array feeds both navs so they cannot drift; Tailwind picks which is visible (`hidden md:flex` / `md:hidden`), no JS media query
  - styled to `docs/design/`: black/zinc with a lime accent, a floating pill bar of three tabs on phone (inactive tabs icon-only, the active one a lime pill with its label) and a four-item sidebar on PC
  - active state is computed from `useLocation()` instead of `NavLink`, because Templates has to light up for `/exercises`, which has no phone tab of its own — `NavLink` can only match its own path. That `owns` rule is scoped to the phone bar; the sidebar has a real Exercises item and would otherwise light two
  - brand assets are copied into `apps/web/public/`; `docs/design/brand/` stays the source of truth
  - icons come from `lucide-react` (the maintained Feather fork, the style the mockups were traced in) but are re-exported under Tanren names from `src/components/icons.tsx`, so swapping an icon or the library is a one-line change. Lucide is stroke-only, so the solid play triangle passes `fill="currentColor"`
  - **deliberate deviation from the mockups**: the PC sidebar has icons, where `screens-pc.png` is text-only. Exercises uses a dumbbell rather than the grid Templates uses, because in the sidebar the two are visible at once and would otherwise be identical
  - everything imports from `react-router`, not `react-router-dom` — that package is a shim since v7 and most tutorials are stale

## Next (I write, Claude guides)
1. React: start-workout + session logging page (phone)
2. React: history, templates, exercises pages (PC)
3. Turn on `strict` in `apps/web/tsconfig.app.json` — it is missing from every tsconfig there, so `strictNullChecks` is off and the `| null` fields all over `src/api/types.ts` go unchecked. Worth doing while the page count is small
4. Auth / charts / PRs later
