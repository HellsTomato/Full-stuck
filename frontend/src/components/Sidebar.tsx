// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom'

export function Sidebar() {
  const links = [
    { path: '/dashboard', label: 'Дашборд' },
    { path: '/athletes', label: 'Спортсмены' },
    { path: '/weekly-plan', label: 'План недели' },
    { path: '/attendance', label: 'Посещения' },
    { path: '/injuries', label: 'Состояние здоровья' },
    { path: '/nutrition', label: 'Рацион' },
    { path: '/reports', label: 'Аналитика' },
  ]

  return (
    <aside className="w-60 bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col">
      {/* Заголовок */}
      <div className="px-4 pt-4 pb-2 text-sm font-semibold text-[var(--color-text)]/70 tracking-wide">
        Навигация
      </div>

      <nav className="flex flex-col gap-1 px-4 pb-4">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
