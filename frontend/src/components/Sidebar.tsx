// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/auth'

export function Sidebar() {
  const { role } = useAuth()
  // Флаги роли определяют, какие пункты меню отрисовываются
  const isTrainer = role === 'TRAINER'
  const isAthlete = role === 'ATHLETE'

  // trainer-only пункты скрываем на уровне UI для роли ATHLETE
  const links = [
    { path: '/dashboard', label: 'Дашборд' },
    ...(isTrainer ? [{ path: '/athletes', label: 'Спортсмены' }] : []),
    ...(isTrainer ? [{ path: '/weekly-plan', label: 'План недели' }] : []),
    ...(isTrainer ? [{ path: '/attendance', label: 'Посещения' }] : []),
    ...(isTrainer ? [{ path: '/injuries', label: 'Состояние здоровья' }] : []),
    ...(isTrainer ? [{ path: '/ration', label: 'Рацион' }] : []),
    ...(isTrainer ? [{ path: '/reports', label: 'Аналитика' }] : []),
    ...(isAthlete ? [{ path: '/athlete-profile', label: 'Мой профиль' }] : []),
  ]

  return (
    <aside className="flex h-full w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="px-4 pt-4 pb-2 text-sm font-semibold tracking-wide text-[var(--color-text)]/70">
        Навигация
      </div>

      <nav className="flex flex-col gap-1 px-4 pb-4">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              'px-3 py-2 rounded-md text-sm transition-all duration-150 ' +
              (isActive
                ? 'bg-[var(--color-primary)] text-white shadow'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]')
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
