/**
 * Shown while a route's loader is still running on a cold load. React Router
 * renders nothing at all otherwise, which reads as a broken app on a slow phone.
 */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-lime-400" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
