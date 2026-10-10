import { Link, useParams } from 'react-router'

export default function Session() {
  // `:id` from the route path. Always a string here, because the route only
  // matches when the segment is present.
  const { id } = useParams()

  return (
    // No tabs on this page: it sits outside AppLayout so set entry gets the
    // whole screen. Hence its own background and padding.
    <div className="min-h-screen bg-black px-4 py-4 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-wide uppercase">Session</h1>
        <Link to="/" className="text-sm text-zinc-500">
          Leave
        </Link>
      </div>
      <p className="mt-8 text-3xl font-black tracking-tight uppercase">
        Logging {id}
      </p>
    </div>
  )
}
