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

- React data layer — written by Claude at my request. `src/api/client.ts` (one `fetch` wrapper + `ApiError`) and `src/api/endpoints.ts` (one function per row of the README table):
  - **reads go through route loaders**: `export async function loader` sits next to the page it feeds and is wired in `routes.tsx`, so a page never renders an empty version of itself and there is no `useEffect` fetch to cancel. This is why `createBrowserRouter` was chosen in the first place
  - **writes do not go through router actions**: every session mutation returns the whole session, so `setSession(await call())` is the entire update. An action would mean a round trip through the router to revalidate data the server already handed back
  - `fetch` rejects only when there was no reply at all, so `status: 0` means "could not reach the API" and every real status is checked by hand. `response.json()` throws on an empty body, so bodies are read as text and parsed — `GET /sessions/active` returns a real `null`
  - `ApiError.activeSessionId` reads the id off the 409 from `POST /sessions`, so that contract lives in one file instead of in every component that starts a workout
  - `errorElement` + `hydrateFallbackElement` on both route branches: without them a dead API shows React Router's stack trace, and a cold load shows nothing at all
- React Start page (`/`) — active-session banner with a live timer, start empty, template cards. "Last trained" is derived from `GET /sessions` (newest first, so first mention wins) because the templates endpoint does not carry it
- React Session page (`/session/:id`) — Session v1 logging: progress dots, one exercise at a time, big kg/reps steppers, done-set chips, add set, add-exercise sheet, finish
  - **which exercise and set you are on is derived**, never stored: it is `findIndex((e) => !e.done)` over the server's own flags. A copy of that in `useState` is a second thing that can be wrong
  - **`key` is how state is reset**: the screen is keyed by session id and the stepper block by set id, because `useState(initial)` only reads its argument on the first render — new props would not reset it, a new key does
  - the ± values stay local until "Done set": getting to 82.5kg is three taps, and three PATCHes for a number you have not committed to is three chances to fail on gym wifi
  - `settleExercise` closes an exercise out once its last set has been **logged**, and only then. Tapping "Done set" is a statement that you are finished; deleting a set is housekeeping, and treating it as finished moves you on from an exercise you never closed — with no way back if it was a mistap. Deleting the last unlogged set therefore lands on a choice (`Next exercise` / `add a set back`) instead. It reads the session the server just returned, never what was rendered
  - "no set left in *this* exercise" and "no exercise left in the session" are different things. Collapsing them into one branch made deleting a set jump to "Workout complete"; they are separate branches now, `current === null` tested first so TypeScript can narrow the rest
  - `− set` / `+ set` on the chip row: removing only ever takes the **last** set and only while it is unlogged, so work you actually did is never one mistap from gone. Deleting a logged set belongs with the session-detail screen
  - the big kg/reps numbers are inputs, not labels — nudging 0 to 100kg was forty taps. The field holds **text**, because a field being typed into passes through `""` and `"2."` on the way to `"2.5"`; parsing happens at the edges (sanitize on keystroke, tidy on blur, convert on submit). Not `type="number"`: spinner arrows, scroll-wheel edits, and `"2."` reported as empty
  - buttons get `cursor: pointer` from one rule in `index.css` — Tailwind v4's preflight dropped the one v3 added
  - "Delete this session" for a workout started by accident: `DELETE /sessions/:id` behind a two-tap confirm that names how many sets go with it, then `navigate('/', { replace: true })` so the dead route is not left in the back stack. Only offered while the session is live — deleting from history belongs with the History page
- `strict` turned on in `tsconfig.app.json` and `tsconfig.node.json`; `react-refresh/only-export-components` now allows a `loader` export beside the page component
- **Deviations from the mockups, deliberate:** the "last time 77.5kg × 8" hint is missing (no endpoint exposes it — the prefilled numbers *are* last time's, but the API never says so); +/− are Lucide icons rather than the `−`/`+` glyphs in the source HTML, for consistency with the rest of the app; error strips use red, which the design does not define

## Next (I write, Claude guides)
1. React: history page (PC) — `GET /sessions` already returns `setCount` and `volume`, and `docs/design/screens/screens-pc.png` is the split-view spec
2. React: templates editor and exercises library (PC) — `docs/design/screens/screens-1.png`
3. Session extras from `docs/design/screens/screens-2.png`: rest timer, workout-finished summary, session detail. Finishing currently just lands on `/history`
4. A "last time" hint on the logging screen — needs the API to return the previous session's numbers per exercise, which it does not today
5. Auth / charts / PRs later
