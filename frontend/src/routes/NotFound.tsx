import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-8">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow p-6 space-y-4 text-center">
        <div className="text-3xl font-bold">404</div>
        <div className="text-gray-700">Страница не найдена</div>
        <Link to="/dashboard" className="inline-block mt-2 px-3 py-2 rounded-2xl bg-accent text-white">
          На главное меню
        </Link>
      </div>
    </div>
  )
}
