# Tanren design reference

This folder is the visual spec for the web app. Match these mockups when building or reviewing any UI.

## Screens (`screens/`)
- `a2-session-v1.png`: Start, Session (focus one exercise), History. Session v1 is the chosen logging layout. Its header shows an older italic `TANREN.` wordmark — use the one in `brand/wordmark.svg` instead.
- `screens-1.png`: Templates, Template editor, Exercises library, Add exercise sheet.
- `screens-2.png`: Rest timer, Workout finished summary, Session detail.
- `screens-pc.png`: PC History with session detail split view and sidebar nav.
- `option-a.png`: the original dark direction, for background only. Where it differs from the files above, the files above win.

`source/` has the static HTML for each sheet (Tailwind CDN), handy for copying exact classes and spacing. Open the files from this folder so their `../brand/` wordmark references resolve.

## Brand (`brand/`)
- Main logo: `logo.svg` (dark square), `logo-transparent.svg`, `logo-512.png`, `logo-1024.png`
- Header wordmark: `wordmark.svg` (TANREN with a lime chevron A and slanted lime underline)
- Favicon: `favicon.svg`, `favicon.ico`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png` (single lime chevron)
- `preview.png` shows them in use

## Style rules
- Dark theme only: black / zinc backgrounds (`zinc-950` `#09090b`), white text, one lime accent (`lime-400` `#a3e635`) for primary actions, active states, done sets and PRs.
- Phone-first: big tap targets, large numbers, large +/- steppers for weight and reps, one huge primary button per screen.
- Session logging shows one exercise at a time (Session v1), with a compact chip row of done sets, a small "last time" hint, and the next exercise below.
- Navigation on phone is a floating pill tab bar with icons; the active tab is a lime pill with its label. It has three tabs — Start, History, Templates — and the Exercises library is reached from the Templates tab, not a tab of its own. The PC sidebar lists all four.
- The Session route has no tab bar (it is a sibling of the layout route in `routes.tsx`). The tab bar in the Session mockup is illustrative only.
- No emoji icons; use SVG icons.
