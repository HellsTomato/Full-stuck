import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

export default function ErrorPage() {
  const error = useRouteError() as any
  const isResp = isRouteErrorResponse(error)
  const status = isResp ? error.status : 500
  const text = isResp ? error.statusText : (error?.message || 'Неизвестная ошибка')

  return (
    <div className="min-h-dvh flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="text-2xl font-semibold">Упс! Что-то пошло не так</div>
        <div className="text-gray-600">Код: {status}</div>
        <div className="text-gray-800">{text}</div>
        <div className="pt-2 flex gap-2">
          <Link to="/dashboard" className="px-3 py-2 rounded-2xl bg-accent text-white">На главное меню</Link>
          <button onClick={() => location.reload()} className="px-3 py-2 rounded-2xl border">Перезагрузить</button>
        </div>
      </div>
    </div>
  )
}
