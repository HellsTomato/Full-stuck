// src/routes/TrainerProfile.tsx
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import {
  getTrainerProfile,
  updateTrainerProfile,
  uploadTrainerPhoto,
  TrainerProfile,
} from '@/services/trainerProfile'

const TrainerProfilePage: React.FC = () => {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<TrainerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)

  const [editData, setEditData] = useState<TrainerProfile | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!username) return

    setLoading(true)
    setError(null)

    getTrainerProfile(username)
      .then((data) => {
        setProfile(data)
        setEditData(data)
      })
      .catch((e) => {
        console.error(e)
        setError('Не удалось загрузить профиль')
      })
      .finally(() => setLoading(false))
  }, [username])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBack = () => {
    navigate('/dashboard')
  }

  const handleChange = (field: keyof TrainerProfile, value: string) => {
    if (!editData) return
    setEditData({ ...editData, [field]: value })
  }

  const handleSave = async () => {
    if (!editData) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateTrainerProfile(editData)
      setProfile(updated)
      setEditData(updated)
      setIsEditing(false)
    } catch (e) {
      console.error(e)
      setError('Ошибка при сохранении профиля')
    } finally {
      setSaving(false)
    }
  }

  // -------- загрузка фото --------
  const handleChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !username) return
    const file = e.target.files[0]
    try {
      setPhotoUploading(true)
      const updated = await uploadTrainerPhoto(username, file)
      setProfile(updated)
      setEditData(updated)
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить фото')
    } finally {
      setPhotoUploading(false)
      e.target.value = ''
    }
  }

  if (!username) {
    return <div className="p-6 text-[var(--color-text)]">Вы не авторизованы</div>
  }

  if (loading) {
    return <div className="p-6 text-[var(--color-text)]">Загрузка профиля…</div>
  }

  if (!profile || !editData) {
    return <div className="p-6 text-[var(--color-text)]">Профиль не найден</div>
  }

  const displayName = editData.fullName || editData.username
  const initials =
    (displayName && displayName.trim()[0]?.toUpperCase()) ||
    (username[0]?.toUpperCase() ?? '?')

  return (
    <div className="p-6 space-y-6 text-[var(--color-text)]">
      {/* Верхняя панель: Назад + Выход */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="btn-outline text-xs px-3 py-1.5 rounded-2xl"
        >
          ← Назад
        </button>
        <button
          onClick={handleLogout}
          className="btn-danger text-xs px-3 py-1.5 rounded-2xl"
        >
          Выйти
        </button>
      </div>

      {/* Блок с аватаром и основными данными */}
      <div className="card-dark p-4 flex flex-col md:flex-row gap-6 items-center">
        {/* Аватар */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
            {editData.photoUrl ? (
              <img
                src={`/api/trainers/profile/photo/${editData.photoUrl}`}
                alt="Фото тренера"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold text-[var(--color-text)]">
                {initials}
              </span>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={handleChoosePhoto}
              disabled={photoUploading}
              className="btn-outline text-xs px-3 py-1.5 rounded-2xl disabled:opacity-60"
            >
              {photoUploading
                ? 'Загрузка…'
                : editData.photoUrl
                ? 'Изменить фото'
                : 'Добавить фото'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Имя / логин + кнопки редактирования */}
        <div className="flex-1 space-y-1">
          <div className="text-xl font-semibold">{displayName}</div>
          <div className="text-sm text-[var(--color-muted)]">
            Логин: {editData.username}
          </div>
        </div>

        <div className="ml-auto flex items-center">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn text-sm rounded-2xl px-4 py-2"
            >
              Редактировать профиль
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn text-sm rounded-2xl px-4 py-2 disabled:opacity-60"
              >
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
              <button
                onClick={() => {
                  setEditData(profile)
                  setIsEditing(false)
                }}
                className="btn-outline text-sm rounded-2xl px-4 py-2"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Форма профиля */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div className="card-dark p-4 space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">
              Полное имя
            </label>
            <input
              type="text"
              value={editData.fullName ?? ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-lg px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted)] disabled:bg-[var(--color-bg)] disabled:opacity-70 outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">
              Email
            </label>
            <input
              type="email"
              value={editData.email ?? ''}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-lg px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted)] disabled:bg-[var(--color-bg)] disabled:opacity-70 outline-none focus:border-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">
              Телефон
            </label>
            <input
              type="tel"
              value={editData.phone ?? ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-lg px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted)] disabled:bg-[var(--color-bg)] disabled:opacity-70 outline-none focus:border-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="card-dark p-4 space-y-4">
          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">
              Образование / квалификация
            </label>
            <textarea
              value={editData.education ?? ''}
              onChange={(e) => handleChange('education', e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-lg px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted)] disabled:bg-[var(--color-bg)] disabled:opacity-70 outline-none focus:border-[var(--color-primary)] min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">
              Достижения, награды, опыт
            </label>
            <textarea
              value={editData.achievements ?? ''}
              onChange={(e) => handleChange('achievements', e.target.value)}
              disabled={!isEditing}
              className="w-full rounded-lg px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-muted)] disabled:bg-[var(--color-bg)] disabled:opacity-70 outline-none focus:border-[var(--color-primary)] min-h-[120px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainerProfilePage
