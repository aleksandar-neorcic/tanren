import { Link, Outlet, useLocation } from 'react-router'
import { ClockIcon, DumbbellIcon, GridIcon, PlayIcon } from '@/components/icons.tsx'

// One source for both navs. `onPhone` is false for Exercises because the phone
// pill bar has three tabs (docs/design/screens/screens-1.png) — the PC sidebar
// lists all four.
const navItems = [
  { to: '/', label: 'Start', Icon: PlayIcon, filled: true, end: true, onPhone: true, owns: [] },
  { to: '/history', label: 'History', Icon: ClockIcon, filled: false, onPhone: true, owns: [] },
  // Exercises has no phone tab of its own, so Templates stays lit while you're
  // in the library — that is what the mockup shows.
  {
    to: '/templates',
    label: 'Templates',
    Icon: GridIcon,
    filled: false,
    onPhone: true,
    owns: ['/exercises'],
  },
  {
    to: '/exercises',
    label: 'Exercises',
    Icon: DumbbellIcon,
    filled: false,
    onPhone: false,
    owns: [],
  },
]

type NavItem = (typeof navItems)[number]

function matches(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function AppLayout() {
  const { pathname } = useLocation()

  // Computed here rather than left to NavLink: one tab has to light up for a
  // route that is not its own path, which NavLink's own matching cannot say.
  // `owns` only counts on the phone bar — the sidebar has its own Exercises
  // item, so letting Templates claim /exercises there would light two.
  const isActive = (item: NavItem, onPhoneBar: boolean) => {
    if (item.end) return pathname === item.to
    if (matches(pathname, item.to)) return true
    return onPhoneBar && item.owns.some((p) => matches(pathname, p))
  }

  return (
    <div className="min-h-screen bg-black text-white md:flex">
      {/* PC chrome: a left sidebar. Hidden on phones. */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-800 bg-zinc-950 p-5 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-1">
        <Link to="/" className="mb-8">
          <img src="/wordmark.svg" alt="Tanren" className="h-10" />
        </Link>
        {navItems.map((item) => {
          const active = isActive(item, false)
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex h-11 items-center gap-3 rounded-xl px-4 transition-colors',
                active
                  ? 'bg-lime-400 font-bold text-black'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
              ].join(' ')}
            >
              <item.Icon size={18} fill={item.filled ? 'currentColor' : 'none'} />
              {item.label}
            </Link>
          )
        })}
        <div className="mt-auto text-xs text-zinc-600">Aleksandar · 鍛錬</div>
      </aside>

      {/* The matched child route renders here. The bottom padding clears the
          floating phone bar; on PC there is nothing to clear. */}
      <main className="w-full flex-1 px-4 pt-4 pb-28 md:px-8 md:py-6 md:pb-6">
        {/* On phones there is no sidebar to carry the wordmark, so the page
            header does. The History mockup drops it; that is a per-page call
            once the real screens exist. */}
        <img src="/wordmark.svg" alt="Tanren" className="mb-4 h-9 md:hidden" />
        <Outlet />
      </main>

      {/* Phone chrome: a floating pill bar. Hidden from md up. Inactive tabs
          are icon-only; the active one grows a lime pill with its label. */}
      <nav className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur md:hidden">
        {navItems
          .filter((item) => item.onPhone)
          .map((item) => {
            const active = isActive(item, true)
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex h-12 items-center gap-2 rounded-full px-4 transition-colors',
                  active ? 'bg-lime-400 font-bold text-black' : 'text-zinc-400',
                ].join(' ')}
              >
                <item.Icon size={20} fill={item.filled ? 'currentColor' : 'none'} />
                {active && <span className="text-sm">{item.label}</span>}
              </Link>
            )
          })}
      </nav>
    </div>
  )
}
