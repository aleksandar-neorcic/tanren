import { createBrowserRouter } from 'react-router'
import AppLayout from './layouts/AppLayout.tsx'
import Exercises from './pages/Exercises.tsx'
import History from './pages/History.tsx'
import NotFound from './pages/NotFound.tsx'
import Session from './pages/Session.tsx'
import Start from './pages/Start.tsx'
import Templates from './pages/Templates.tsx'

export const router = createBrowserRouter([
  {
    // A layout route: no path of its own, so AppLayout renders for every child
    // below and the children swap in through its <Outlet />.
    element: <AppLayout />,
    children: [
      // `index` is the child that matches the parent's path exactly, i.e. "/".
      { index: true, element: <Start /> },
      { path: 'history', element: <History /> },
      { path: 'templates', element: <Templates /> },
      { path: 'exercises', element: <Exercises /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    // A sibling of the layout, not a child: the logging screen renders with no
    // nav chrome at all, so a mistap can't drop you out of a workout.
    path: 'session/:id',
    element: <Session />,
  },
])
