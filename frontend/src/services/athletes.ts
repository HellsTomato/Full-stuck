// src/services/athletes.ts
import type { Athlete } from "@/types"

const base = "" // при Vite proxy оставляем пустым

// ====================================================================
// 1. Получение списка спортсменов
// GET /api/athletes?search=&group=
// ====================================================================
export async function getAthletes(params: { search?: string; group?: string } = {}) {
  const qs = new URLSearchParams()

  if (params.search) qs.set("search", params.search)
  if (params.group) qs.set("group", params.group)

  const url = `${base}/api/athletes${qs.toString() ? "?" + qs.toString() : ""}`

  const res = await fetch(url)
  if (!res.ok) throw new Error("Ошибка загрузки спортсменов")

  const json = await res.json()

  // backend отдаёт список как List<Athlete>
  const items: Athlete[] = Array.isArray(json) ? json : (json.items ?? [])

  // нормализуем имя группы
  return {
    items: items.map((a) => ({
      ...a,
      group: a.group || a.grp, // важно
    })),
  }
}

// ====================================================================
// 2. Создание спортсмена
// POST /api/athletes
// ====================================================================
export async function createAthlete(body: Partial<Athlete>) {
  const mapped = {
    id: body.id,
    fullName: body.fullName,
    birthDate: body.birthDate,
    grp: body.group, // переводим group → grp
    phone: body.phone,
    notes: body.notes,
  }

  const res = await fetch(`${base}/api/athletes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapped),
  })

  if (!res.ok) throw new Error("Ошибка: не удалось сохранить спортсмена")

  return res.json()
}

// ====================================================================
// 3. Обновление спортсмена
// PATCH /api/athletes/{id}
// ====================================================================
export async function updateAthlete(id: string, body: Partial<Athlete>) {
  const mapped = {
    fullName: body.fullName,
    birthDate: body.birthDate,
    grp: body.group,
    phone: body.phone,
    notes: body.notes,
  }

  const res = await fetch(`${base}/api/athletes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapped),
  })

  if (!res.ok) throw new Error("Ошибка: не удалось сохранить изменения")

  return res.json()
}
