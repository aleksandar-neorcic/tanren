# Tanren (鍛錬) — personal gym app

## What I want
A personal gym app I will actually use.

- **Phone-first for logging workouts** in the gym (big tap targets, fast set entry)
- **PC for everything else** (history, templates, PRs, charts, editing exercises)
- One responsive web app (React). Do **not** build React Native / separate mobile app for v1.
- English-first UI. Japanese i18n can wait.
- Same stack as before when useful: React + Vite + TS + Tailwind, NestJS + Prisma + SQLite, npm, Node 22.
- **It is also a portfolio piece.** I will send it with applications for React developer roles, so the web app has to be finished, demoable, and something I can defend decision by decision. See Next.

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

## Code + design reference (IMPORTANT before writing anything in `apps/web`)
- `docs/conventions.md` is the code spec: folder layout, hooks, forms, imports, and what was rejected. Follow it; if something in it is wrong, change the doc rather than quietly deviating.

### Design
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
  - overlays (`ConfirmDialog`, `AddExerciseSheet`) share `useScrollLock`: an overlay is `fixed`, so without it the page keeps scrolling behind a sheet you cannot scroll. The hook also replaces the scrollbar's width with padding, or hiding the overflow widens the viewport and shifts the page sideways on PC. The sheet's list adds `overscroll-contain`, or a flick past the last exercise hands the leftover scroll to the page behind
  - finishing with exercises still open asks first: finishing is one-way (no endpoint reopens a session, and `finish` is idempotent so a retry will not undo it). `ConfirmDialog` takes a `tone`, defaulting to `danger` so a forgotten prop makes an action look more alarming than it is, never less
  - "Delete this session" for a workout started by accident: `DELETE /sessions/:id` behind a two-tap confirm that names how many sets go with it, then `navigate('/', { replace: true })` so the dead route is not left in the back stack. Only offered while the session is live — deleting from history belongs with the History page
- React History page (`/history`) — the session list. Claude wrote most of the markup at my request; the hook and the branches are mine. What it settles:
  - it reuses Start's query key (`['sessions', 'history']`) rather than taking one of its own, so Start → History is a cache hit and one request feeds both. `select` is per **observer**, not per cache entry: Start maps the same data through `lastTrainedByTemplate` and History reads it raw, from one fetch
  - invalidation was already free — `Session.tsx`'s bridge invalidates the `['sessions']` prefix, which covers this key
  - hooks above the guards, derived values below them: `useNow(false)` has to run on every render, while `weekAgo` / `thisWeek` / `weekVolume` only type-check after `sessions` has narrowed. Same file, opposite placement rules, and the difference is only whether the line calls a hook
  - **`Date.now()` in a component body is a lint error** — `react-hooks/purity` in eslint-plugin-react-hooks v7. `useNow(false)` is the sanctioned form: one `Date.now()` in a lazy `useState` initialiser, no interval, nothing to tick for a 7-day window
  - "this week" is a rolling 7 days, not a calendar week — no week-start to pick and no locale to get wrong
  - an unfinished session **stays in the list**, with a lime ring and "In progress" where the set count goes, instead of being filtered out: a workout that disappears while you are doing it reads as a bug. It does mean a live row shows `0 kg`, because `setCount` and `volume` count done sets only
  - `formatWeekday` and `formatVolume` joined `lib/format.ts`. Volume drops the fraction at the display edge rather than rounding upstream — the API keeps the exact sum
  - the phone tab bar is `fixed`, so rows scrolled out from under it half-visible. `AppLayout` gained a `pointer-events-none` scrim that fades the page to black under the bar, and `pb-32` to match its height
- React Templates list (`/templates`) and the first half of the **Template editor** (`/templates/new`, `/templates/:id`). Claude wrote the code to my chunk-by-chunk questions; the walkthrough is in the session, the decisions are below:
  - the editor is a **sub-screen**, `pages/Templates/pages/TemplateEditor/`, per conventions §1 — one level deeper, not flattened into `pages/`
  - **one component serves create and edit.** `useParams().id === undefined` is "new", the same `id` disables the detail query and picks `create` vs `update` inside `mutationFn`, so the form never branches on which it is doing
  - `templates/new` is declared **above** `templates/:id`. React Router scores static segments higher anyway, but the order means nothing depends on that — the same rule as `@Get('active')` in the Nest controller
  - **`values`, not `defaultValues`, for async data.** `defaultValues` is read once on mount, when the query has not resolved; `values` resets the form when the data arrives. It compares deeply, so `toForm(template)` rebuilding its object every render does not wipe what you typed. `resetOptions: { keepDirtyValues: true }` is the guard if a background refetch ever lands mid-edit — not needed at one user with focus refetching off
  - **`toForm` drops `id`, `order` and the nested `exercise`.** `PUT` deletes and recreates every row, so old row ids mean nothing; `order` comes from the array index, and keeping a copy is a second fact that can disagree; the name is looked up from the `['exercises']` query by id, so renaming an exercise cannot leave a stale copy inside a template
  - **`isLoading`, not `isPending`.** A disabled query reports `isPending` forever — `/templates/new` would spin for eternity. `isLoading` is `isPending && isFetching`, which is the flag that means "first load in flight". Written out longhand first, then replaced by the built-in
  - `handleSubmit((values) => save(values))` keeps the arrow on purpose: `handleSubmit` calls back with `(data, event)` and `mutate` takes `(variables, options)`, so point-free would feed the submit event into React Query's options slot — wrong in a way nothing reports
  - **`AddExerciseSheet` moved off its `useEffect` fetch onto `useQuery(['exercises'])`** — the last hand-rolled fetch in the app. Its props did not change, so `Session.tsx` was untouched. It deletes the StrictMode cancel-flag race and makes the sheet open from cache with no request
  - `endpoints.ts` gained `templates.get/create/update/remove` and `types.ts` a `TemplateInput`
- Seed data for the demo (`apps/api/prisma/seed.ts`) — twelve finished sessions behind the exercises and templates, so a fresh install opens on a History page with something on it:
  - `WorkoutSession` has no natural unique key to upsert on, so the session block is skipped whenever `count() > 0` rather than inventing a key the app never reads. Re-running the seed after a real workout must not bury it
  - every session is finished and every set is `done`: `SessionsService.create` 409s while a session is open, so an unfinished seed row would break "Start" on first tap, and `toSessionSummary` counts only done sets, so undone ones seed rows reading `0 sets · 0 kg`
  - dates are `now` minus N days, never literals, or the demo's history reads as stale a month after a deploy
  - progression is derived from how many times ago a lift was trained, with no `Math.random()`: a seed that differs per run makes a screenshot unreproducible. Weights move in per-exercise increments (`[kg, stepKg]`) so every number is one real plates can make
  - it also gives the logging screen's prefill something to work with — `lastLoggedSets` had nothing to read from on a fresh database

- **Templates editor finished** — the picker, editable targets and validation. Claude wrote
  most of this round to my questions; the decisions:
  - the **`AddExerciseSheet` renders outside the `<form>`**, in a fragment beside it. The sheet is
    `fixed`, so it floats above the page visually — but `position: fixed` removes an element from
    the visual flow, not from the DOM tree. Nested in the form, its search box is a text input in a
    form that has a submit button, so Enter implicitly submits: three letters, Enter out of habit,
    and the template saves and navigates away mid-pick
  - `onPick` **`append`s a plain object**, never `setValue` on the array path. `useFieldArray` keeps
    its own row ids beside the values, and only its mutators (`append`/`remove`/`move`) update both;
    `setValue` writes values alone, so React re-keys the rows and every input below the insertion
    point remounts
  - **`valueAsNumber` for `targetSets`, `setValueAs: toNumberOrNull` for reps and weight.** A DOM
    input hands back a string and the schema wants a number, but RHF's converter turns `''` into
    `NaN`, and `NaN` fails a `.nullable()` number — so a blank box, which legitimately means "not
    planned", would show an error. Verified against the installed converter, not the docs:
    `(e,{valueAsNumber:r,setValueAs:s})=>E(e)?e:r?''===e?NaN:e?+e:e:…`, where `E=e=>void 0===e`
  - that same line is why **`toNumberOrNull` takes `unknown`, not `string`**: only `undefined`
    bypasses the converter, so RHF also runs it over the `null` already sitting in form state and
    `null.trim()` threw during the input's render. It now lives in `src/lib/numberField.ts` so any
    future numeric form shares the rule
  - **errors render per field, not per row.** One message under three side-by-side boxes cannot say
    which box it means — fixing Sets to 1 just showed the next field's error and read as "I fixed it
    and it still complains". Each `<label>` owns its message, and the invalid input gets a red
    **ring** rather than a border: these inputs have no border, so adding one on error would grow the
    box by 2px and shift the row
  - `targetInputClass(hasError)` builds the class string, because React has no `[ngClass]` — a
    conditional class means producing the final string yourself. Its real job is the 160-character
    base string that was otherwise identical in three inputs. Safe without `tailwind-merge` only
    because the ternary emits one of the two ring colours, never both
  - **`name: z.string().trim().min(1)`** — `.trim()` *before* `.min(1)`, or a name of three spaces
    has length 3 and passes. It is a transform, so the trimmed string is also what gets submitted:
    `zodResolver` hands Zod's parsed output to `onSubmit`
  - the same hole was open on the API, where `@IsNotEmpty()` only rejects `''`. `src/common/
    trim.decorator.ts` adds `@Trim()` for required names and `@TrimToNull()` for nullable text —
    blank and `null` would read the same to a human but are two values in the column. Applied to all
    seven user-entered text fields. It works because the global pipe has `transform: true`, so
    class-transformer builds the DTO (running `@Transform`) before class-validator sees it
  - **rejected:** tidying `01` to `1` on blur. It was written, then removed — `Number('01')` is 1, so
    the value was never wrong, only the box, and saving navigates away a second later. Logged in
    conventions §10 territory: cosmetic normalisation on a field whose value is already correct
  - **`printWidth: 100` added to `apps/api/.prettierrc`**, which had none. The default 80 disagreed
    with how the API was actually written, so any `npm run format` there rewrapped twelve untouched
    files
- **Delete a template** — from the editor and from each row of the list, both behind `ConfirmDialog`:
  - **a prefix invalidation is a bet that every key under it is still fetchable, and delete loses
    that bet.** `invalidateQueries({ queryKey: ['templates'] })` also matches the editor's own
    `['templates', id]`, which is still a mounted observer at that moment, so it refetched the
    template the server had just deleted — a 404 in the console on every successful delete.
    `exact: true` is the fix; create and update keep the broad call, because they leave every key
    under the prefix valid
  - **`removeQueries` on a mounted query is worse, not better.** It was tried first and caused the
    same 404 by a different route: dropping the entry leaves the observer with no data, so the next
    render re-creates the query and fetches. Measured against the installed `query-core` — the
    detail entry is left to `gcTime` instead, which collects it five minutes after the editor
    unmounts
  - on the list the trash button is a **sibling** of the card's `<Link>` inside a `relative`
    wrapper, not a child of it. A `<button>` inside an `<a>` is invalid HTML, and the click would
    bubble into a navigation; the usual `preventDefault` + `stopPropagation` patch works by
    claiming the click was a navigation being cancelled, when it never was one. Siblings say what
    is true: two targets that overlap visually. `pr-14` on the link keeps the exercise list clear
    of the icon
  - the id is a mutation **variable** (`mutationFn: (id: string) => …`), so one mutation serves
    every row, and the dialog is closed from the call site's own `onSuccess` option rather than the
    hook's — the hook owns what is true for every caller, the call site owns its own state
  - **rejected: an `id` prop on `ConfirmDialog`.** Its only possible use is being handed back
    through `onConfirm`, and the handler is written inside the scope that already has the id. That
    round trip is what `BsModalService.show(C, { initialState })` forces on you in Angular, where
    the modal is built outside your component; a dialog rendered by your own JSX has no such
    boundary. Also rejected for now: extracting the `useState` + `useCallback` pair behind a
    `useConfirm()` hook — four call sites, two of which are booleans that would fit it badly
  - **known gap, deliberately left:** `ConfirmDialog`'s `busy` disables both buttons but not the
    backdrop or the Escape key, so the dialog can be dismissed mid-request. The mutation finishes
    and navigates either way

- **Exercises library** (`/exercises`) — the last stub, now the full CRUD plus archive/restore,
  against `docs/design/screens/screens-1.png` panel 3:
  - **two deviations from that mockup, both recorded rather than faked.** The rows show no
    equipment ("Chest · Barbell"), because `Exercise` has no such column and adding one buys a
    subtitle on one screen; and no `120 × 5 best`, because that is a PR — deliberately out of
    scope, and no endpoint carries it (`GET /sessions` returns summaries, not sets, so it would
    mean fetching every session to compute one number)
  - `exercisesApi` had only `list()`. It gained `create`, `update`, `archive` and an
    `includeArchived` flag that **defaults to false**, so `AddExerciseSheet` and the template
    editor kept compiling untouched. No `get(id)`: nothing deep-links one exercise, and an unused
    endpoint function is a line to defend for nothing
  - **two request types, where templates needed one.** `PUT` replaces, so an omitted field means
    "clear it"; `PATCH` merges, so it means "leave it alone". Hence `ExerciseInput` for create and
    `ExerciseUpdate = Partial<ExerciseInput> & { archived?: boolean }` for the patch — which also
    makes restore `update(id, { archived: false })` rather than a third endpoint
  - **the form holds strings; `null` exists only at the API boundary.** An `<input>` cannot hold
    `null` — React flips it to uncontrolled and warns — so `schemas.ts` types the optional text as
    `z.string().trim()` and the page converts `'' || null` on the way out. `.trim()` is a
    transform, so its output is what reaches `onSubmit`: the whitespace-name hole is closed before
    it opens, on the client as well as in `@TrimToNull()`
  - `defaultValues`, not `values`, in `ExerciseSheet` — the exercise comes from the list already on
    screen, so it is in hand at mount. The rule is not "create vs edit", it is **is the data there
    when the form mounts**. The sheet is keyed `sheet.exercise?.id ?? 'new'` so editing a second
    row remounts it rather than showing the first row's defaults
  - sheet state is `null | { exercise?: Exercise }`: closed, creating, editing — one value, so
    "open" and "which row" cannot disagree the way `isOpen` + `editing` can
  - **archive is in the sheet, restore is on the row.** Deliberately asymmetric: archiving ends a
    decision made while looking at the exercise; restoring is a one-tap undo of something already
    visible in a filtered list
  - **no hard delete, and the schema is why.** Both FKs onto `Exercise` are `onDelete: Cascade`, so
    deleting one would erase every `SessionExercise` and its `SetLog`s — logged workouts gone from
    History. Templates can be hard-deleted because `WorkoutSession.template` is `SetNull`; the two
    entities got different rules on purpose. If true deletion is ever wanted, the honest form is
    "delete only when nothing references it, else 409", which is a migration and a route, not a
    button
  - **muscle group stays free text.** The seed already holds nine granular values (Quads,
    Rear delts, Calves) — a taxonomy that belongs to the user, not the schema, and an enum would
    make every new group a migration. A native `<datalist>` was tried first and replaced: it is
    drawn by the OS, so it cannot be sized to the input or forced above it. The dropdown is now a
    real `<ul>`, `absolute bottom-full w-full`, with `onMouseDown` + `preventDefault` so the press
    does not blur the input out from under its own click
  - the input's `onBlur` is **composed**, not replaced: `{...register()}` carries RHF's own
    handler, and a later prop of the same name would overwrite it
  - `useWatch({ control, name })`, not `form.watch(...)` — the latter trips React Compiler ("returns
    functions which cannot be memoized"), which then skips optimising the whole component
  - search and the muscle-group chips are **client-side** (no search endpoint, 42 rows), and the
    chip list is derived from the data, so it can never list a group nothing uses

- **Demo recordings instead of a deploy** — `docs/demo/` holds four GIFs (logging a session,
  building a template, the exercise library, and the PC layout) plus a 90-second MP4 tour, and
  both READMEs lead with them:
  - **GIF for anything that has to play inline.** GitHub renders an `.mp4` referenced from a
    repo path as a link, not a player; only video uploaded to its own CDN embeds. So the tour
    is linked and the four clips are GIFs
  - re-encoded from the source MP4s at 10fps / 260px (760px for the desktop tour): 2.1 MB for
    the four, against 6.5 MB for the originals. Recompressing the existing GIFs would have
    been worse than going back to the video
  - the PC recording exists because the README claims "PC for everything else" and showed only
    a phone. A claim with no evidence is the kind of thing a reviewer notices
  - `docs/screenshots/` was removed once nothing referenced it
  - **known gap the recordings exposed: Exercises cannot be reached on a phone.** `navItems`
    has `onPhone: false` for it, the pill bar has three tabs, and nothing on the Templates
    screen links to `/exercises`, so filming it needed a direct URL. The mockup has the same
    hole, so it is a design gap rather than a deviation

- **`docs/conventions.md` — the web app's house style, and the spec for every screen from here on.** Folder layout, naming, barrels, imports, the `use<Entity>()` hook shape, forms, the page shape, and a table of patterns rejected on purpose. It was lifted from another project of mine and written out in full so nothing depends on that repo being on disk. Highlights:
  - **taken**: feature folders (`pages/<Feature>/index.tsx` + `components/` + `hooks/` + `types.ts` + `schemas.ts`) with a barrel `index.ts` per `components/`; a `use<Entity>()` hook per feature owning its queries and mutations; react-hook-form + `zodResolver` with the schema in `schemas.ts`; the loading → error → data `renderContent()` page shape; `@/` for cross-concern imports and `./` within a folder
  - **taken with a change**: request/update types come from `z.infer` instead of being hand-written beside the schema, because a hand-written `types.ts` duplicates the `schemas.ts` that defines it and drifts from it. Only the server *response* type is written by hand
  - **left**: a full `shadcn` init. It would lay slate tokens over the black/lime spec in `docs/design/`, and a reviewer opening a folder of 25 generated components learns nothing about me. Radix primitives go under the overlays instead, keeping the hand-written styling
  - **left**: per-entity optimistic-update boilerplate (~200 near-identical lines repeated for every entity in the source project). Write the first hook longhand, then extract one `useCrudResource`
  - **left**: `baseUrl` beside `paths` (deprecated in TS 6; `paths` has resolved relative to the tsconfig since 4.4), `clsx([...])` where `cn()` exists, a hardcoded `text-red-500` next to a theme token, a media-query hook doing a Tailwind breakpoint's job, and one `XWithSuspense` wrapper per route — the full list with reasons is §10 of `docs/conventions.md`
- **TanStack Query replaces route loaders** (decided, migration still to do). The route *tree* is unaffected — the pathless layout and `session/:id` as a sibling stand; only `loader` / `useLoaderData` go. Why: three mutation-heavy screens are still unwritten, and `setSession(await call())` only works on Session because every session mutation returns the whole session. Exercises and Templates have list ↔ detail ↔ archive views that must agree after a write, and hand-rolling that three times is worse code than `invalidateQueries`
  - `src/lib/queryClient.ts` holds the client so a test can build a provider around the same config the app runs with; `QueryClientProvider` sits outside `RouterProvider` in `main.tsx` so the cache outlives navigation
  - its defaults differ from the desktop-dashboard ones they came from on purpose: retries and refetch-on-reconnect stay **on** (a dropped request on gym wifi is the common case), focus refetching is **off** (every glance at a phone is a focus event), `staleTime` 30s (single-user app — nobody else is writing)
- **Start migrated off its route loader onto React Query** (I wrote it, Claude guided). `pages/Start/index.tsx` + `pages/Start/hooks/useStart.ts` — the first feature folder, and the pattern the remaining screens copy:
  - three queries, keyed `['templates']`, `['sessions','active']`, `['sessions','history']`. Hierarchical on purpose: `invalidateQueries({ queryKey: ['sessions'] })` catches both session queries and leaves templates alone
  - "last trained" is `select`ed off the history query rather than given a key of its own — one request feeds both it and the raw list History will want. `select` is passed by reference (`select: lastTrainedByTemplate`), not wrapped in an arrow, or it re-runs every render
  - `mutate`, not `mutateAsync`: nothing awaits the result, and `mutateAsync` rejects, so an un-caught call would log an unhandled rejection on every failure
  - **invalidate before navigating *toward* the affected data, after navigating away from it.** `useStart` navigates away from Start, so it invalidates second; `Session.finish`/`discard` navigate back toward it, so they invalidate first
  - the page branches on the **data**, not on `isLoading` — a boolean does not narrow `Template[] | undefined`, and `active === undefined` (not loaded) has to stay distinct from `active === null` (no workout)
  - query errors and mutation errors stay separate: a failed load replaces the page, a failed tap shows a strip above a page that still works
  - with no loader, `errorElement` no longer catches a dead API — a failed query is a value, not a throw. Each page owns its error branch now
- `Session.tsx` got a `useQueryClient` **bridge** — `finish` and `discard` invalidate `['sessions']`. Without it, deleting a session left it on Start's banner inside the 30s `staleTime` and tapping it 404'd. Temporary until Session migrates properly
- `npm run typecheck` in `apps/web`; `.vscode/settings.json` points the editor at the repo's TypeScript 6 (its own bundled copy does not read `paths` declared without `baseUrl`) and makes auto-import write `@/...`
- `strict` turned on in `tsconfig.app.json` and `tsconfig.node.json`; `react-refresh/only-export-components` now allows a `loader` export beside the page component
- **Deviations from the mockups, deliberate:** the "last time 77.5kg × 8" hint is missing (no endpoint exposes it — the prefilled numbers *are* last time's, but the API never says so); +/− are Lucide icons rather than the `−`/`+` glyphs in the source HTML, for consistency with the rest of the app; error strips use red, which the design does not define — and that red now also marks the two irreversible actions ("Delete this session", "Delete this template"), matching the confirm button they open. Archiving stays neutral because it is reversible, and the Templates list's per-row trash icon stays neutral because a column of red icons shouts on every visit. The old `text-zinc-600` on all of them measured about 2.7:1 against black, under the 4.5:1 AA floor

## Next — the portfolio plan (I write, Claude guides)

The API is feature-complete against the README table. **The web app is the
deliverable being judged**, and it is currently 2 of 5 screens: History,
Templates and Exercises are still stubs. A reviewer who clicks History and sees
a placeholder stops reading the React and starts thinking "unfinished side
project", so that gap outranks everything else below.

### Sunday 2026-11-15 — everything left, in order

Saturday ended here: P0 is built (all five screens real), the deploy is cut on purpose,
the API has 8 e2e tests, both READMEs lead with the demo recordings, and everything is
committed and pushed. Sending on **Monday 2026-11-16, 12:00 JST**.

1. **Make the repo public** — `gh repo edit --visibility public`. The hard blocker: until
   then every link, GIF and file in the README 404s for whoever gets the link. Mine to do,
   nobody else's
2. **Exercises is unreachable on a phone** — the only functional hole left. `navItems` has
   `onPhone: false` for it, the pill bar holds three tabs, and nothing on the Templates
   screen links to `/exercises`. One `<Link>` on the Templates screen closes it
3. **CI** (Claude) — `.github/workflows`: typecheck + lint + `npm run test:e2e` on push.
   Cheap now that the tests exist, and a green check on the repo front page is what reads
   "professional" with no deploy behind it
4. **Decide the `Co-Authored-By: Claude` trailer** — still on most commits, and the new ones
   deliberately have none. Keep it or strip it, but decide rather than discover it mid-interview.
   The README's "How I built this" already says how the project was built, so keeping it is
   consistent
5. Optional, only if the morning leaves room: reorder rows in the template editor
   (`useFieldArray`'s `move()`), and the green play button on the Templates list cards

Not doing: the deploy (see 4 below), auth, charts, PRs, Docker, i18n beyond the Japanese
README.

### P0 — not sendable without these
**Deadline: sending this with applications on Monday 2026-11-16; the work stops Sunday night.** (Was Sunday 2026-11-15 — moved a day on 2026-11-14, so Sunday is a full working day rather than a half one.) Order below is the order to do them in, and anything not on it waits.

0. ~~`Start.tsx` onto Query hooks~~ — **done**. `Session.tsx` still runs on its loader with the invalidation bridge, and **that is deliberate until after the send**: it works, the visible bug is fixed, and "mid-migration, Start is done, Session is next" is a question I can answer out loud. A stub History page is not
1. ~~**History page**~~ — **the list is done** (see Done). What is left of `screens-pc.png` is the split-view detail pane, the search box and row selection, i.e. the PC half of the screen. Parked behind 2 and 3: a working list is not a stub, a stub Templates page is
2. **Templates editor** — **done** (see Done). What is left is optional polish,
   in the order to do it if there is time:
   1. **Reorder** (~20 min) — up/down buttons calling `useFieldArray`'s `move()`. A
      deliberate deviation from `screens-1.png`, which says DRAG TO REORDER: touch drag
      needs dnd-kit plus sensors and keyboard support, which is hours, not minutes
   2. ~~**Delete template**~~ — **done** (see Done), from both the editor and the list
   3. On the list screen: the green play button that starts a session from a card, and the
      "last Oct 7" hint (needs the history query plus promoting `lastTrainedByTemplate` out of `useStart`)
3. ~~**Exercises library**~~ — **done** (see Done). No page in the app is a stub any more
4. ~~**Deploy somewhere clickable**~~ — **cut on 2026-11-14, deliberately.** Not because
   there was no time to get *something* online, but because deploying is a thing I want to
   learn properly and do myself rather than hand to Claude to make work by Monday. Doing it
   that way this weekend would mean a live URL I could not explain, which is worth less in an
   interview than not having one. It stays on the list for after the send, as my own piece of
   work: a Node host for Nest, SQLite persistence across restarts, and the fact that `/api`
   only exists today because Vite's dev server proxies it.
   - what replaced it: **recordings of the app running** (see Done). A reviewer can watch the
     whole thing work without a URL. "I cut the deploy to learn it properly, and recorded the
     app instead" is an answer I can give out loud; "I ran out of time" is not
   - the repo link is therefore the whole deliverable, so **the repo has to be public** and
     the README has to carry the demo above the fold

### P1 — expected for a React role specifically
5. **Tests** — `apps/web` has no test runner at all today. Claude sets up Vitest + Testing Library, I write them. Not coverage numbers; about six that mean something: the set-logging flow, the derived current-exercise logic (where the real bug lived), `ApiError` parsing a Nest validation body
6. ~~**README screenshot or GIF at the top**~~ — **done**, and then some: four GIFs and a 90-second tour (see Done) — reviewers spend about a minute. 103 lines of prose and no images is the wrong trade
7. **CI** (Claude) — no `.github/workflows` yet. Typecheck + lint + test is cheap and signals professionalism

### Deliberately not before sending
Auth, charts, PRs, Docker, i18n, and the `screens-2.png` extras (rest timer,
workout-finished summary, session detail). None of them change a hiring
decision, and each one delays P0.

**Parked, wanted later: group the History list by week.** A flat list of dates
makes you count sessions by eye; a training log is read as "how many this
week". One grouping pass over the already-newest-first array, keyed by that
week's Monday (`(getDay() + 6) % 7` days back — Monday for a training week, not
locale-dependent), rendering a heading per group with that week's session count
and volume. The standalone "This week ..." summary line comes out when it
lands, because each group header carries the same numbers. It is a deviation
from `screens-pc.png`, which shows a flat list, so it needs a line in Done
explaining why — the way the sidebar-icons deviation is recorded. Polish on a
screen that already works, so it waits behind the Templates editor, Exercises
and the deploy.

### Risks to manage — not code
- **Claude wrote most of `apps/web`** (data layer, both screens, dialogs, the fixes). Interviewers will point at `settleExercise`, the `key`-based state reset, or loaders-vs-actions and ask *why this way*. The fix is writing the Templates editor unaided and being able to defend `Session.tsx` cold — those answers land well, they just have to be mine
- **Every commit carries a `Co-Authored-By: Claude` trailer**, visible to anyone reading the history. Keep it or drop it, but decide — do not discover it mid-interview

### Later, when something actually blocks on it
- **Auth.** `docs/decisions.md` already says it arrives when the app leaves localhost. Note that using this at a commercial gym is a *reachability* problem first, not an auth one — Tailscale solves that with no code. A shared-secret Nest guard is enough to expose a deploy publicly; a `User` model only matters if someone else ever uses it
- **A "last time" hint** on the logging screen — needs the API to return the previous session's numbers per exercise, which it does not today
- **Charts / PRs**
