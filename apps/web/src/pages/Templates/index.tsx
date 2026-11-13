import { Link } from 'react-router'
import { errorMessage } from '@/api/client.ts'
import { PlusIcon } from '@/components/icons.tsx'
import Loading from '@/components/Loading.tsx'
import useTemplates from './hooks/useTemplates.ts'

export default function Templates() {
  const { templates, error } = useTemplates()

  if (error) {
    return (
      <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {errorMessage(error)}
      </p>
    )
  }

  if (!templates) return <Loading />

  return (
    <div className="max-w-xl md:max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight uppercase">Templates</h1>
        <Link
          to="/templates/new"
          className="flex h-9 items-center gap-1 rounded-full bg-lime-400 px-4 text-sm font-bold text-black"
        >
          <PlusIcon size={16} />
          New
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-500">
          No templates yet. Make one and it shows up here and on Start.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              to={`/templates/${template.id}`}
              className="block rounded-2xl bg-zinc-900 p-4"
            >
              <div className="text-xl font-black tracking-tight uppercase">{template.name}</div>
              <div className="text-sm text-zinc-500">
                {template.exercises.length}{' '}
                {template.exercises.length === 1 ? 'exercise' : 'exercises'}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {template.exercises.map((row) => row.exercise.name).join(' · ')}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        to="/templates/new"
        className="mt-3 flex h-14 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-800 text-zinc-500"
      >
        + New template
      </Link>
    </div>
  )
}
