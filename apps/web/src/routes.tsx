import { createBrowserRouter } from 'react-router'
import AppLayout from './layouts/AppLayout.tsx'
import Loading from './components/Loading.tsx'
import RouteError from './components/RouteError.tsx'
import Exercises from './pages/Exercises.tsx'
import History from './pages/History.tsx'
import NotFound from './pages/NotFound.tsx'
import Session, { loader as sessionLoader } from './pages/Session.tsx'
import Start, { loader as startLoader } from './pages/Start/index.tsx'
import Templates from './pages/Templates.tsx'

export const router = createBrowserRouter([
  {
    // A layout route: no path of its own, so AppLayout renders for every child
    // below and the children swap in through its <Outlet />.
    element: <AppLayout />,
    // Anything a child loader throws stops here instead of at the root, so the
    // nav stays on screen and you can tap your way out of a broken page.
    errorElement: <RouteError />,
    hydrateFallbackElement: <Loading />,
    children: [
      // `index` is the child that matches the parent's path exactly, i.e. "/".
      // The loader runs before the element renders, so Start never has to draw
      // an empty version of itself first.
      { index: true, element: <Start />, loader: startLoader },
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
    loader: sessionLoader,
    // Its own error element for the same reason it has its own layout: this
    // route is outside the shell, so it cannot inherit the one above.
    errorElement: <RouteError />,
    hydrateFallbackElement: <Loading />,
  },
])
