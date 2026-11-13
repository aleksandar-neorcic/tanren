# Code conventions — `apps/web`

The house style this app is written to. It was lifted from another project of
mine and is recorded here in full so nothing depends on that project still
existing on disk. Where it differs from where it came from, the reason is
written down — those differences are deliberate and defensible, not drift.

`apps/api` has its own conventions, recorded in `CLAUDE.md` under the Nest
modules. This file is the web app only.

---

## 1. Folder layout

A screen is a folder, not a file. The folder owns everything only that screen
uses; anything a second screen needs moves up to `src/`.

```
src/
  api/              # one client + one function per API route (shared)
  components/       # shared across screens: icons, overlays, state cards
  layouts/          # AppLayout and any future chrome
  lib/              # framework-agnostic helpers, hooks, queryClient
  pages/
    Exercises/
      index.tsx        # the page component, default export
      components/      # only used by this screen
        index.ts       # barrel
        ExerciseRow.tsx
        CreateExerciseDialog.tsx
      hooks/
        useExercises.ts
      schemas.ts       # zod schemas for this screen's forms
      types.ts         # server response shapes for this screen
    Templates/
      index.tsx
      ...
```

Sub-screens nest one level deeper rather than flattening into `pages/`:

```
pages/Templates/pages/TemplateEditor/index.tsx
```

**Promotion rule:** a component starts inside the screen that needs it. The
second screen that needs it is what moves it to `src/components/` — not a guess
up front. `ConfirmDialog` and `AddExerciseSheet` live in `src/components/`
because Session, Exercises and Templates all open them.

## 2. Naming and exports

- Components: `PascalCase.tsx`, one component per file, **default export**.
- Hooks: `useThing.ts`, **default export**, one hook per file.
- Everything else (`schemas.ts`, `types.ts`, `lib/*`): **named exports**.
- A page's file is always `index.tsx`, and it is imported by its explicit path
  (`./pages/Start/index.tsx`), not by the bare folder. Directory resolution works,
  but spelling the file out keeps the extension rule below true everywhere.

## 3. Barrels

Every `components/` folder gets an `index.ts` that imports then re-exports:

```ts
import CreateExerciseDialog from './CreateExerciseDialog.tsx'
import ExerciseRow from './ExerciseRow.tsx'

export { CreateExerciseDialog, ExerciseRow }
```

So a page imports `{ ExerciseRow } from './components'`, one line regardless of
how many it pulls. Barrels are for `components/` folders only — not for `api/`,
`lib/` or `hooks/`, where a barrel just hides which file a symbol lives in.

## 4. Imports

- `@/...` for anything outside the current folder — `@/api/endpoints.ts`,
  `@/components/ConfirmDialog.tsx`.
- `./...` for siblings inside the same folder, including `./components`.
- Never `../`. If you are reaching upward, use the alias.
- Keep the file extension (`.ts` / `.tsx`); the tsconfig runs with
  `allowImportingTsExtensions`.
- **Order: external packages, then `@/...`, then `./...`**, with no blank lines
  between the groups. Nothing enforces it — Prettier does not sort imports and
  no lint rule is installed — so it is a reading convention, not a guarantee.
  Files written before this was written down do not follow it; fix them when you
  touch them rather than in a sweep. Sorting on save (`import/order`, or a
  Prettier sort-imports plugin) is a dependency plus a reformat of every file,
  and was not worth it before the deadline.

The alias is declared twice on purpose: `paths` in `tsconfig.app.json` type-checks
it, `resolve.alias` in `vite.config.ts` resolves it at build time. Change one and
the other has to follow. There is **no `baseUrl`** — it is deprecated in
TypeScript 6, and `paths` has resolved relative to the tsconfig since 4.4.

## 5. Data

**`src/api/` is the only place a URL is written.** `client.ts` wraps `fetch` and
throws `ApiError`; `endpoints.ts` has one function per row of the README's API
table. Nothing else calls `fetch`.

**One `use<Entity>()` hook per screen**, in that screen's `hooks/`. It owns the
query keys, the mutations and the cache invalidation, and it imports the request
functions rather than redefining them:

```ts
import { exercisesApi } from '@/api/endpoints.ts'
// ...

export default function useExercises() {
  const queryClient = useQueryClient()

  const { data: exercises, isLoading, error, refetch } = useQuery({ /* ... */ })

  const { mutateAsync: createExercise, isPending: isCreating } = useMutation({ /* ... */ })

  return { exercises, isLoading, error, refetch, createExercise, isCreating }
}
```

The returned object is flat and named per operation — `isCreatingExercise`, not
a nested `create.isPending` — so a component destructures exactly what it uses.

**Write the first hook longhand.** When the second and third look like the first
with the nouns swapped, extract one `useCrudResource(key, api)`. Do not start
with the abstraction, and do not ship three copies of it either.

**Cache rules:** every mutation ends in `invalidateQueries` for the keys it could
have changed. Optimistic updates are for lists you edit in place (`onMutate`
snapshot → `setQueryData` → roll back in `onError`); everything else just
invalidates. Do not hand-roll a `setQueryData` that duplicates what an
invalidation would fetch anyway.

`src/lib/queryClient.ts` holds the one `QueryClient`, so a test can wrap the same
config the app runs with. `QueryClientProvider` sits outside `RouterProvider` in
`main.tsx` — the cache has to outlive navigation.

## 6. Types

- **Request / form shapes come from zod**: `type CreateExerciseForm = z.infer<typeof CreateExerciseSchema>`.
  Never hand-write a type next to the schema that defines it — the two drift and
  nothing catches it.
- **Server response shapes are hand-written** in `api/types.ts` (shared) or the
  screen's `types.ts` (screen-specific). These describe what the API sends, which
  zod does not know.

## 7. Forms

react-hook-form + `zodResolver`. The schema lives in the screen's `schemas.ts`
and is the single source of validation — the submit button is disabled on
`!formState.isValid`, never on a hand-written `!watch('name')` that restates a
rule the schema already has.

Prefer `register` for plain inputs and `<Controller>` for anything custom
(selects, checkboxes, steppers). Avoid `watch('field')` just to feed a controlled
component: it re-renders the whole form on every keystroke.

Nested rows (the template editor) use `useFieldArray`.

## 8. Page shape

A page resolves loading → error → data before it renders anything else:

```tsx
export default function ExercisesPage() {
  const { exercises, isLoading, error, refetch } = useExercises()

  const renderContent = () => {
    if (isLoading) return <Loading />
    if (error) return <RouteError onRetry={refetch} />
    if (!exercises?.length) return <EmptyState />
    return <ExerciseList exercises={exercises} />
  }

  return (
    <div>
      <header>{/* title + subtitle */}</header>
      {renderContent()}
    </div>
  )
}
```

The empty state is a real branch, not an accident of rendering a list of zero.

## 9. UI

- Tailwind only, matched to `docs/design/`. That folder is the spec; when code
  and mockup disagree, say so rather than silently picking one.
- **No `shadcn` init.** It would lay its own tokens over the black/lime theme,
  and a folder of generated components says nothing about the person who shipped
  it. Components here are written by hand and styled to the design doc.
- **Radix primitives under the overlays.** Dialogs and sheets get
  `@radix-ui/react-dialog` for the focus trap, focus restore and inert background
  — the parts that are genuinely painful by hand. The styling stays ours.
- Icons are re-exported from `src/components/icons.tsx` under Tanren names, so
  swapping an icon or the library is a one-line change.
- Colours come from the theme, never ad hoc. One hardcoded `text-red-500` sitting
  next to a token is how a palette rots.

## 10. Rejected on purpose

Recorded so they do not get reintroduced later as "the standard":

| Pattern | Why not |
|---|---|
| `baseUrl` beside `paths` | deprecated in TS 6; `paths` alone has worked since 4.4 |
| Per-entity optimistic-update boilerplate | ~200 near-identical lines per entity. Extract after the third |
| Hand-written request types beside a zod schema | duplicates the schema and drifts from it |
| `clsx([...])` where a `cn()` helper exists | skips `tailwind-merge`, so conflicting classes resolve by CSS order |
| `isMobile ? Drawer : Dialog` repeated per dialog | one responsive overlay component, not seven copies |
| A JS media-query hook for layout | Tailwind breakpoints where possible; a hook returns the wrong value on first render |
| One `XWithSuspense` wrapper per route | one helper, or the router's own pending component |
| Full `shadcn` init | see §9 |
