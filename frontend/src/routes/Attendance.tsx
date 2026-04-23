// frontend/src/routes/Attendance.tsx

import { useEffect, useMemo, useState } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { Attendance } from '@/types'
import {
  getAttendance,
  postAttendanceBulk,
  type AttendanceBulkItem,
} from '@/services/attendance'
import { useAuth } from '@/context/auth'

// Тип статуса из доменной модели
type AttendanceStatus = Attendance['status']

// Список доступных групп (совпадает с enum TrainingGroup на бэке)
const GROUP_OPTIONS = [
  { value: 'JUNIORS', label: 'Юниоры' },
  { value: 'SENIORS', label: 'Старшие' },
] as const

// Конфиг статусов: value = enum, label = текст для отображения
const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT' as AttendanceStatus, label: 'Присутствовал' },
  { value: 'LATE' as AttendanceStatus, label: 'Опоздал' },
  { value: 'ABSENT' as AttendanceStatus, label: 'Отсутствовал' },
]

// Сегодняшняя дата в формате 'YYYY-MM-DD'
function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

// Человекочитаемый label для группы
function getGroupLabel(value?: string): string {
  if (!value) return '—'
  const found = GROUP_OPTIONS.find((g) => g.value === value)
  return found?.label ?? value
}

export default function AttendancePage() {
  const { role } = useAuth()
  const isTrainer = role === 'TRAINER'
  // выбранная дата
  const [date, setDate] = useState<string>(() => getTodayISO())
  // выбранная группа (по умолчанию — юниоры)
  const [group, setGroup] = useState<string | undefined>('JUNIORS')
  // строки таблицы (копия того, что пришло с бэка)
  const [rows, setRows] = useState<Attendance[]>([])
  // флаг "есть несохранённые изменения"
  const [isDirty, setIsDirty] = useState(false)
  // карта "athleteId -> сохранённый статус", чтобы знать, что уже лежит в БД
  const [savedStatusMap, setSavedStatusMap] = useState<
    Record<string, AttendanceStatus>
  >({})

  const queryClient = useQueryClient()

  // ключ для React Query (кэш по дате + группе)
  const queryKey = useMemo(
    () => ['attendance', { date, group }] as const,
    [date, group]
  )

  // ─────────────────────────────────────────────
  // ЗАГРУЗКА ПОСЕЩАЕМОСТИ
  // ─────────────────────────────────────────────
  const {
    data: serverRows = [],
    isLoading,
    isError,
    error,
  } = useQuery<Attendance[]>({
    queryKey,
    queryFn: () => getAttendance({ date, group }),
    placeholderData: (prev) => prev ?? [],
  })

  // При изменении данных с сервера — обновляем локальное состояние
  // и запоминаем "сохранённый" статус для каждой строки
  useEffect(() => {
    setRows(serverRows)
    setIsDirty(false)

    const map: Record<string, AttendanceStatus> = {}
    serverRows.forEach((r) => {
      map[r.athleteId] = r.status
    })
    setSavedStatusMap(map)
  }, [serverRows])

  // ─────────────────────────────────────────────
  // СОХРАНЕНИЕ ПОСЕЩАЕМОСТИ (BULK)
  // ─────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      const items: AttendanceBulkItem[] = rows.map((row) => ({
        athleteId: row.athleteId,
        status: row.status,
      }))

      return await postAttendanceBulk({
        date,
        group,
        items,
      })
    },
    onSuccess: (updatedRows) => {
      // Обновляем строки тем, что вернул бэк
      setRows(updatedRows)
      setIsDirty(false)

      // Обновляем сохранённые статусы — теперь они совпадают с тем, что в БД
      const map: Record<string, AttendanceStatus> = {}
      updatedRows.forEach((r) => {
        map[r.athleteId] = r.status
      })
      setSavedStatusMap(map)

      // Инвалидируем кэш, чтобы дашборд и другие экраны видели актуальные данные
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })

  // ─────────────────────────────────────────────
  // ОБРАБОТЧИКИ UI
  // ─────────────────────────────────────────────

  // Клик по кнопке статуса
  const handleStatusClick = (athleteId: string, status: AttendanceStatus) => {
    if (!isTrainer) return
    setRows((prev) =>
      prev.map((row) =>
        row.athleteId === athleteId ? { ...row, status } : row
      )
    )
    setIsDirty(true)
    // savedStatusMap НЕ трогаем — зелёный/жёлтый/красный появится только после "Сохранить"
  }

  // "Сохранить изменения"
  const handleSave = () => {
    if (!isTrainer) return
    if (saveMutation.isPending || !isDirty) return
    saveMutation.mutate()
  }

  // Изменение даты
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
  }

  // Изменение группы
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || undefined
    setGroup(value)
  }

  const isEmpty = !isLoading && rows.length === 0

  return (
    <div className="p-6 space-y-6">
      {/* Шапка страницы */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-50">
            Посещаемость
          </h1>
          <p className="text-sm text-slate-400">
            Выберите дату и группу, затем отметьте статус для каждого спортсмена.
          </p>
        </div>

        {/* Фильтры + кнопка сохранения */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Дата */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-slate-400">
              Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-50 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Группа */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-slate-400">
              Группа
            </label>
            <select
              value={group ?? ''}
              onChange={handleGroupChange}
              className="min-w-[160px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-50 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Все с тренировкой</option>
              {GROUP_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* Сохранить */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!isTrainer || !isDirty || saveMutation.isPending || rows.length === 0}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition',
              isTrainer && isDirty && !saveMutation.isPending && rows.length > 0
                ? 'bg-violet-500 text-white hover:bg-violet-600'
                : 'bg-slate-700 text-slate-300 cursor-not-allowed',
            ].join(' ')}
          >
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </header>

      {/* Карточка с таблицей */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow">
        {isLoading && (
          <div className="p-6 text-sm text-slate-400">
            Загрузка данных...
          </div>
        )}

        {isError && !isLoading && (
          <div className="p-6 text-sm text-red-400">
            Ошибка загрузки посещаемости:{' '}
            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </div>
        )}

        {isEmpty && !isLoading && !isError && (
          <div className="p-6 text-sm text-slate-400">
            Нет спортсменов или нет тренировки для выбранной даты и группы.
          </div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <>
          {!isTrainer && (
            <div className="px-4 py-3 text-xs text-slate-400 border-b border-slate-800">
              Для роли атлета доступен только просмотр посещаемости.
            </div>
          )}
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  ФИО
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Группа
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Статус посещения
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const savedStatus = savedStatusMap[row.athleteId]

                return (
                  <tr
                    key={row.athleteId}
                    className={
                      idx % 2 === 0
                        ? 'border-t border-slate-800 bg-slate-900/40'
                        : 'border-t border-slate-800 bg-slate-900/20'
                    }
                  >
                    {/* ФИО */}
                    <td className="px-4 py-3 align-middle text-slate-50">
                      {row.fullName}
                    </td>

                    {/* Группа */}
                    <td className="px-4 py-3 align-middle text-slate-200">
                      {getGroupLabel(row.group as string)}
                    </td>

                    {/* Статусы */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((s) => {
                          const isActive = row.status === s.value
                          const isSaved = isActive && savedStatus === s.value

                          // Логика цвета:
                          //  - НЕ активная: серая
                          //  - активная, но НЕ сохранена: фиолетовая
                          //  - активная + сохранённая: зелёная/жёлтая/красная по статусу
                          let colorClasses = ''

                          if (!isActive) {
                            colorClasses =
                              'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-violet-400 hover:text-violet-200'
                          } else if (isSaved) {
                            // сохранённый статус
                            switch (s.value) {
                              case 'PRESENT':
                                // зелёный
                                colorClasses =
                                  'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                                break
                              case 'LATE':
                                // жёлтый
                                colorClasses =
                                  'border-amber-400 bg-amber-500/20 text-amber-100'
                                break
                              case 'ABSENT':
                                // красный
                                colorClasses =
                                  'border-rose-400 bg-rose-500/20 text-rose-100'
                                break
                              default:
                                colorClasses =
                                  'border-violet-400 bg-violet-500/20 text-violet-200'
                            }
                          } else {
                            // выбрали, но ещё не нажали "Сохранить"
                            colorClasses =
                              'border-violet-400 bg-violet-500/20 text-violet-200'
                          }

                          return (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() =>
                                handleStatusClick(row.athleteId, s.value)
                              }
                              className={[
                                'rounded-full border px-3 py-1 text-xs font-medium transition',
                                colorClasses,
                              ].join(' ')}
                            >
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </>
        )}
      </section>
    </div>
  )
}
