// src/services/trainerProfile.ts
// Сервис работы с профилем тренера: загрузка, сохранение и загрузка фото
import { api, apiFetch } from './client'

export type TrainerProfile = {
  username: string
  fullName: string
  email?: string
  phone?: string
  education?: string
  achievements?: string
  photoUrl?: string          // здесь лежит имя файла, которое вернёт бэкенд
}

const BASE_URL = '/api'

// Получить профиль тренера по username
export async function getTrainerProfile(username: string): Promise<TrainerProfile> {
  return api<TrainerProfile>(
    `${BASE_URL}/trainers/profile?username=${encodeURIComponent(username)}`
  )
}

// Обновить текстовые данные профиля (без фото)
export async function updateTrainerProfile(
  profile: TrainerProfile
): Promise<TrainerProfile> {
  return api<TrainerProfile>(`${BASE_URL}/trainers/profile`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

// Загрузить фото профиля тренера (файл с диска)
export async function uploadTrainerPhoto(
  username: string,
  file: File
): Promise<TrainerProfile> {
  const formData = new FormData()
  formData.append('username', username) // совпадает с @RequestParam("username")
  formData.append('file', file)         // совпадает с @RequestParam("file")

  const response = await apiFetch(`${BASE_URL}/trainers/profile/photo`, {
    method: 'POST',
    body: formData,                     // ВАЖНО: не задаём Content-Type вручную
  })

  if (!response.ok) {
    throw new Error('Не удалось загрузить фото')
  }

  return (await response.json()) as TrainerProfile
}

export async function deleteTrainerPhoto(username: string): Promise<TrainerProfile> {
  return api<TrainerProfile>(
    `${BASE_URL}/trainers/profile/photo?username=${encodeURIComponent(username)}`,
    {
      method: 'DELETE',
    }
  )
}
