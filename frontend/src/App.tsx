// src/App.tsx
import React, { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { useAuth } from '@/context/auth'
import { getTrainerProfile, TrainerProfile } from '@/services/trainerProfile'

export default function App() {
  const { username } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState<TrainerProfile | null>(null)

  useEffect(() => {
    if (!username) {
      setProfile(null)
      return
    }

    getTrainerProfile(username)
      .then((data) => setProfile(data))
      .catch((err) => {
        console.error('Не удалось загрузить профиль в шапке:', err)
        setProfile(null)
      })
  }, [username, location.pathname])

  const handleProfileClick = () => navigate('/trainer-profile')

  const displayName = profile?.fullName || username || ''
  const initials =
    (displayName && displayName.trim()[0]?.toUpperCase()) ||
    (username?.[0]?.toUpperCase() ?? '?')

  const avatarSrc = profile?.photoUrl
    ? `/api/trainers/profile/photo/${profile.photoUrl}`
    : null

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0b1020] via-[#131a35] to-[#1e2353] text-[var(--color-text)]">
      {/* Боковая панель */}
      <Sidebar />

      {/* Основная часть */}
      <div className="flex-1 flex flex-col">
        {/* Верхняя панель */}
        <header className="flex items-center justify-between px-6 py-3 bg-transparent border-b border-[var(--color-border)] backdrop-blur-md">
          <h1 className="text-xl font-semibold text-[var(--color-text)]/80">
            Приложение для тренера
          </h1>

          <div className="flex items-center gap-4">
            {!username ? (
              <NavLink
                to="/login"
                className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition"
              >
                Войти
              </NavLink>
            ) : (
              <button
                onClick={handleProfileClick}
                className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Фото тренера"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {initials}
                    </span>
                  )}
                </div>
                <span className="text-sm text-white">{displayName}</span>
              </button>
            )}
          </div>
        </header>

        {/* Основное содержимое */}
        <main className="flex-1 overflow-auto p-6 bg-transparent">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
