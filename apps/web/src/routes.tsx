import { createBrowserRouter } from 'react-router'
import AppLayout from './layouts/AppLayout.tsx'
import Loading from './components/Loading.tsx'
import RouteError from './components/RouteError.tsx'
import Exercises from './pages/Exercises/index.tsx'
import History from './pages/History/index.tsx'
import NotFound from './pages/NotFound.tsx'
import Session, { loader as sessionLoader } from './pages/Session/index.tsx'
import Start from './pages/Start/index.tsx'
import Templates from './pages/Templates/index.tsx'
import TemplateEditor from './pages/Templates/pages/TemplateEditor/index.tsx'

export const router = createBrowserRouter([
  {
    // A layout route: no path of its own, so AppLayout renders for every child
    // below and the children swap in through its <Outlet />.
    element: <AppLayout />,
    // A throw from anything below stops here instead of at the root, so the nav
    // stays on screen and you can tap your way out of a broken page. Pages fetch
    // through React Query now, and a failed query is a *value*, not a throw — so
    // each page renders its own error branch and this catches what is left:
    // render-time crashes below this layout.
    errorElement: <RouteError />,
    hydrateFallbackElement: <Loading />,
    children: [
      // `index` is the child that matches the parent's path exactly, i.e. "/".
      // No loader: Start reads through `useStart` and owns its own loading and
      // error branches, so the route only says which component renders.
      { index: true, element: <Start /> },
      { path: 'history', element: <History /> },
      { path: 'templates', element: <Templates /> },
      { path: 'templates/new', element: <TemplateEditor /> },
      { path: 'templates/:id', element: <TemplateEditor /> },
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
