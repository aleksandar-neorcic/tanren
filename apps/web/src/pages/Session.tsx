import { Link, useParams } from 'react-router'

export default function Session() {
  // `:id` from the route path. Always a string here, because the route only
  // matches when the segment is present.
  const { id } = useParams()

  return (
    // No tabs on this page: it sits outside AppLayout so set entry gets the
    // whole screen. Hence its own background and padding.
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900">
      <Link to="/" className="text-sm text-slate-600 underline">
        Leave
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Session</h1>
      <p className="mt-2 text-slate-600">Logging session {id}.</p>
    </div>
  )
}
