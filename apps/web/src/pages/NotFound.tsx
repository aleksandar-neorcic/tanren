import { Link } from 'react-router'

export default function NotFound() {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight uppercase">Not found</h1>
      <Link to="/" className="mt-1 inline-block text-sm text-lime-400">
        Back to start ›
      </Link>
    </div>
  )
}
