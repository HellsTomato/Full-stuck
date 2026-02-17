// src/routes/RationPage.tsx

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import {
  getRationSummary,
  type RationSummaryRow,
  type RationGroupFilter,
  applyLocalToSummary,
} from '@/services/ration'

dayjs.locale('ru')

const GROUP_OPTIONS: { value: RationGroupFilter; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'JUNIORS', label: 'Юниоры' },
  { value: 'SENIORS', label: 'Старшие' },
]

// Маппинг кодов статуса еды в русские подписи
const STATUS_LABEL_MAP: Record<string, string> = {
  FULL: 'Полный рацион',
  PARTIAL: 'Частичный рацион',
  NONE: 'Нет питания',
}

const RationPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialDate = searchParams.get('date') ?? dayjs().format('YYYY-MM-DD')
  const initialGroup = (searchParams.get('group') as RationGroupFilter) || 'ALL'
  const initialSearch = searchParams.get('search') ?? ''

  const [date, setDate] = useState(initialDate)
  const [group, setGroup] = useState<RationGroupFilter>(initialGroup)
  const [search, setSearch] = useState(initialSearch)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ration-summary', date, group, search],
    queryFn: () =>
      getRationSummary({
        date,
        group,
        search: search.trim() || undefined,
      }),
  })

  const rows: RationSummaryRow[] = applyLocalToSummary(data ?? [])

  const syncUrl = (nextDate: string, nextGroup: RationGroupFilter, nextSearch: string) => {
    const params = new URLSearchParams()
    params.set('date', nextDate)
    params.set('group', nextGroup)
    if (nextSearch.trim()) params.set('search', nextSearch.trim())
    setSearchParams(params)
  }

  const handleDateChange = (value: string) => {
    setDate(value)
    syncUrl(value, group, search)
  }

  const handleGroupChange = (value: RationGroupFilter) => {
    setGroup(value)
    syncUrl(date, value, search)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    syncUrl(date, group, value)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-white mb-6">Рацион</h1>

      {/* Фильтры */}
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Дата</label>
          <input
            type="date"
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Группа</label>
          <select
            className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
            value={group}
            onChange={(e) => handleGroupChange(e.target.value as RationGroupFilter)}
          >
            {GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-slate-400 mb-1">Поиск по имени</label>
          <input
            type="text"
            placeholder="Начните вводить ФИО…"
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Состояния загрузки / ошибки */}
      {isLoading && (
        <div className="text-sm text-slate-400 mb-3">Загружаем данные рациона…</div>
      )}

      {isError && (
        <div className="text-sm text-red-400 mb-3">
          Ошибка загрузки рациона: {(error as Error)?.message}
        </div>
      )}

      {/* Таблица */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-900/70 text-xs text-slate-400">
              <th className="px-4 py-3 text-left font-medium">Спортсмен</th>
              <th className="px-4 py-3 text-left font-medium">Группа</th>
              <th className="px-4 py-3 text-left font-medium">Статус еды</th>
              <th className="px-4 py-3 text-left font-medium">Вес</th>
              <th className="px-4 py-3 text-left font-medium">Примечания</th>
              <th className="px-4 py-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  Спортсмены не найдены под выбранные фильтры.
                </td>
              </tr>
            )}

            {rows.map((row) => {
              const weightText =
                typeof row.weight === 'number'
                  ? `${row.weight.toFixed(1)} кг`
                  : '—'

              // тут уже переводим код статуса в русскую подпись
              const statusText = row.foodStatus
                ? STATUS_LABEL_MAP[row.foodStatus] ?? row.foodStatus
                : '—'

              const notesText = row.notes || '—'

              const athleteLink = `/ration/athlete/${row.athleteId}?date=${date}&fullName=${encodeURIComponent(
                row.fullName,
              )}&groupName=${encodeURIComponent(row.groupName ?? '')}`

              return (
                <tr
                  key={row.athleteId}
                  className="border-t border-slate-800 hover:bg-slate-900/70 transition-colors"
                >
                  <td className="px-4 py-3 text-white">
                    <Link
                      to={athleteLink}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {row.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.groupName}</td>
                  <td className="px-4 py-3 text-slate-200">{statusText}</td>
                  <td className="px-4 py-3 text-slate-200">{weightText}</td>
                  <td className="px-4 py-3 text-slate-300 max-w-[260px]">
                    <span className="line-clamp-2">{notesText}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={athleteLink}
                      className="inline-flex items-center rounded-xl border border-indigo-500/60 bg-indigo-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
                    >
                      Открыть рацион
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RationPage
