import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Not found</h1>
      <Link to="/" className="mt-2 inline-block text-slate-600 underline">
        Back to start
      </Link>
    </div>
  )
}
