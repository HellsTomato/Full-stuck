// src/routes/AthleteRationPage.tsx

import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { getRationSummary, saveRationForDay } from '@/services/ration'
import { useAuth } from '@/context/auth'

dayjs.locale('ru')

type RationRow = {
  foodStatus?: string | null
  weight?: number | null
  notes?: string | null
}

const statusLabelMap: Record<string, string> = {
  FULL: 'Полный рацион',
  PARTIAL: 'Частичный рацион',
  NONE: 'Нет питания',
}

const FOOD_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Не задано' },
  { value: 'FULL', label: 'Полный рацион' },
  { value: 'PARTIAL', label: 'Частичный рацион' },
  { value: 'NONE', label: 'Нет питания' },
]

type EditFormState = {
  foodStatus: string
  weight: string
  notes: string
}

const AthleteRationPage = () => {
  const { role } = useAuth()
  const isTrainer = role === 'TRAINER'
  const { athleteId } = useParams()
  const [searchParams] = useSearchParams()

  const [dailyData, setDailyData] = useState<Record<string, RationRow | null>>({})
  const [isLoading, setIsLoading] = useState(false)

  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    foodStatus: '',
    weight: '',
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fullName = searchParams.get('fullName') ?? 'Спортсмен'
  const groupName = searchParams.get('groupName') ?? ''
  const baseDateStr = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')

  const baseDate = useMemo(() => dayjs(baseDateStr), [baseDateStr])

  // неделя (пн–вс) вокруг выбранной даты
  const weekDays = useMemo(() => {
    const start = baseDate.startOf('week') // понедельник
    return Array.from({ length: 7 }, (_, index) => {
      const d = start.add(index, 'day')
      return {
        date: d,
        label: d.format('dd, DD.MM'),
        key: d.format('YYYY-MM-DD'),
      }
    })
  }, [baseDate])

  // загрузка сводки по текущему спортсмену на неделю
  useEffect(() => {
    if (!athleteId) return

    const abort = { cancelled: false }
    setIsLoading(true)

    Promise.all(
      weekDays.map((day) =>
        getRationSummary({
          date: day.date.format('YYYY-MM-DD'),
          search: fullName,
        }),
      ),
    )
      .then((results) => {
        if (abort.cancelled) return

        const map: Record<string, RationRow | null> = {}
        results.forEach((rows, idx) => {
          const first = (rows as any[])[0] ?? null
          const dateKey = weekDays[idx].key

          if (first) {
            map[dateKey] = {
              foodStatus: first.foodStatus ?? (first as any).mealStatus ?? null,
              weight: first.weight ?? null,
              notes: first.notes ?? null,
            }
          } else {
            map[dateKey] = null
          }
        })

        setDailyData(map)
      })
      .catch((err) => {
        console.error('Failed to load athlete ration', err)
      })
      .finally(() => {
        if (!abort.cancelled) setIsLoading(false)
      })

    return () => {
      abort.cancelled = true
    }
  }, [athleteId, fullName, weekDays])

  const weekStartLabel = weekDays[0]?.date.format('DD.MM')
  const weekEndLabel = weekDays[6]?.date.format('DD.MM')

  // ——— Открыть модалку редактирования ———
  const openEdit = (dateKey: string) => {
    if (!isTrainer) return
    const rec = dailyData[dateKey]

    setEditForm({
      foodStatus: rec?.foodStatus ?? '',
      weight: rec?.weight != null ? String(rec.weight) : '',
      notes: rec?.notes ?? '',
    })
    setSaveError(null)
    setEditingDate(dateKey)
  }

  const closeEdit = () => {
    if (isSaving) return
    setEditingDate(null)
  }

  // ——— Сохранение рациона на день ———
  const handleSave = async () => {
    if (!athleteId || !editingDate) return

    setIsSaving(true)
    setSaveError(null)

    const normalizedWeight =
      editForm.weight.trim() === ''
        ? null
        : Number(editForm.weight.replace(',', '.'))

    try {
      await saveRationForDay({
        athleteId,
        date: editingDate,
        foodStatus: editForm.foodStatus || null,
        weight:
          normalizedWeight != null && !Number.isNaN(normalizedWeight)
            ? normalizedWeight
            : null,
        notes: editForm.notes.trim() || null,
      })

      // локально обновляем карточку
      setDailyData((prev) => ({
        ...prev,
        [editingDate]: {
          foodStatus: editForm.foodStatus || null,
          weight:
            normalizedWeight != null && !Number.isNaN(normalizedWeight)
              ? normalizedWeight
              : null,
          notes: editForm.notes.trim() || null,
        },
      }))

      setEditingDate(null)
    } catch (e) {
      console.error(e)
      setSaveError('Не удалось сохранить рацион. Попробуйте ещё раз.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8">
      <Link
        to={`/ration?date=${baseDate.format('YYYY-MM-DD')}`}
        className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6"
      >
        ← Назад к списку рациона
      </Link>

      <h1 className="text-2xl font-semibold text-white mb-1">Рацион спортсмена</h1>
      <div className="text-slate-300 mb-6">
        <span className="font-medium">{fullName}</span>
        {groupName && <span className="ml-2 text-slate-400">• {groupName}</span>}
        <div className="text-sm text-slate-400 mt-1">
          Неделя: {weekStartLabel} — {weekEndLabel}
        </div>
      </div>

      {isLoading && (
        <div className="mb-3 text-sm text-slate-400">Загружаем данные рациона…</div>
      )}

      <div className="space-y-3">
        {weekDays.map((day) => {
          const rec = dailyData[day.key]

          const statusText =
            (rec?.foodStatus && statusLabelMap[rec.foodStatus]) ||
            rec?.foodStatus ||
            '—'
          const weightText =
            typeof rec?.weight === 'number' ? `${rec.weight.toFixed(1)} кг` : '—'
          const notesText = rec?.notes || '—'

          return (
            <div
              key={day.key}
              className="flex items-start justify-between rounded-2xl border border-slate-700 bg-slate-900/40 px-5 py-4"
            >
              <div>
                <div className="text-sm font-medium text-white">{day.label}</div>
                <div className="mt-1 text-xs text-slate-400">
                  Примечания:{' '}
                  <span className="text-slate-200 break-words">{notesText}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right text-sm">
                  <div className="text-slate-400 text-xs">Статус еды</div>
                  <div className="text-white">{statusText}</div>
                </div>

                <div className="text-right text-sm">
                  <div className="text-slate-400 text-xs">Вес</div>
                  <div className="text-white">{weightText}</div>
                </div>

                <button
                  type="button"
                  onClick={() => openEdit(day.key)}
                  disabled={!isTrainer}
                  className="ml-4 rounded-xl border border-indigo-500/60 bg-indigo-600/80 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  {isTrainer ? (rec ? 'Редактировать' : 'Добавить') : 'Только просмотр'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ——— Модалка редактирования ——— */}
      {isTrainer && editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6">
            <div className="mb-4">
              <div className="text-sm text-slate-400 mb-1">
                {fullName}
                {groupName && <span className="ml-1 text-slate-500">• {groupName}</span>}
              </div>
              <h2 className="text-lg font-semibold text-white">
                Рацион на {dayjs(editingDate).format('DD.MM.YYYY')}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Статус еды
                </label>
                <select
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white outline-none"
                  value={editForm.foodStatus}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, foodStatus: e.target.value }))
                  }
                  disabled={isSaving}
                >
                  {FOOD_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Вес, кг
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white outline-none"
                  value={editForm.weight}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  placeholder="Например, 72.5"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Примечания
                </label>
                <textarea
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white outline-none min-h-[80px] resize-y"
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Например: вечером протеиновый коктейль, добавить фрукты…"
                  disabled={isSaving}
                />
              </div>

              {saveError && (
                <div className="text-xs text-red-400 whitespace-pre-line">
                  {saveError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl border border-slate-600 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                disabled={isSaving}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl border border-indigo-500/60 bg-indigo-600/80 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
                disabled={isSaving}
              >
                {isSaving ? 'Сохраняем…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AthleteRationPage
