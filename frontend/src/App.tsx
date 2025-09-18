import { Outlet, NavLink } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { useAuth } from '@/context/auth'

export default function App() {
  const { user, logout } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b shadow-sm">
          <h1 className="text-xl font-semibold">Приложение для тренера</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700">{user.fullName}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Выйти
                </button>
              </>
            ) : (
              <NavLink to="/login" className="text-sm text-blue-600">
                Войти
              </NavLink>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
