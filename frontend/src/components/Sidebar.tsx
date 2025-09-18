
import { NavLink } from 'react-router-dom'
import { t } from '@/i18n/ru'

const links = [
  { to: '/dashboard', label: t('menu.dashboard') },
  { to: '/athletes', label: t('menu.athletes') },
  { to: '/weekly-plan', label: t('menu.weeklyPlan') },
  { to: '/attendance', label: t('menu.attendance') },
  { to: '/injuries', label: t('menu.injuries') },
  { to: '/nutrition', label: t('menu.nutrition') },
  { to: '/reports', label: t('menu.reports') },
]

export function Sidebar(){
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-4 font-semibold text-gray-800">{t('appTitle')}</div>
      <nav className="flex flex-col gap-1 p-2" aria-label="Главное меню">
        {links.map(l=>(
          <NavLink
            key={l.to}
            to={l.to}
            className={({isActive}) =>
              `px-3 py-2 rounded-2xl focus-ring ${isActive? 'bg-accent text-white':'hover:bg-gray-100'}`
            }
            aria-label={l.label}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
