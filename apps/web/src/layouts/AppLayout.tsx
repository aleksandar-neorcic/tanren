import { NavLink, Outlet } from 'react-router'

// One list drives both navs, so a new tab can never show up in only one of them.
// `end` keeps the "/" tab from matching every other route (see note in routes.tsx).
const tabs = [
  { to: '/', label: 'Start', end: true },
  { to: '/history', label: 'History' },
  { to: '/templates', label: 'Templates' },
  { to: '/exercises', label: 'Exercises' },
]

function topLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900',
  ].join(' ')
}

function bottomLinkClass({ isActive }: { isActive: boolean }) {
  return [
    'flex flex-1 items-center justify-center py-3 text-sm font-medium',
    isActive ? 'text-slate-900' : 'text-slate-500',
  ].join(' ')
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* PC chrome: a top bar. Hidden on phones. */}
      <header className="hidden border-b border-slate-200 bg-white md:block">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-semibold">Tanren</span>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={topLinkClass}>
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* The matched child route renders here. The extra bottom padding keeps
          the last row clear of the fixed phone tab bar. */}
      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 md:pb-6">
        <Outlet />
      </main>

      {/* Phone chrome: a fixed tab bar. Hidden from md up. */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={bottomLinkClass}>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
