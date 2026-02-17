// frontend/src/routes/Injuries.tsx

import { useMemo, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Injury, InjuryStatus } from '@/styles/types'
import { fetchInjuries } from '@/services/injuries'

// Метки групп
const GROUP_LABELS: Record<string, string> = {
  JUNIORS: 'Юниоры',
  SENIORS: 'Старшие',
}

// Фильтры по статусу
const STATUS_FILTERS: { value: 'ALL' | InjuryStatus; label: string }[] = [
  { value: 'ALL', label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'CLOSED', label: 'Закрытые' },
]

function formatDate(date?: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function statusLabel(status: InjuryStatus): string {
  return status === 'ACTIVE' ? 'Активная' : 'Закрыта'
}

function statusBadgeClasses(status: InjuryStatus): string {
  return status === 'ACTIVE'
    ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
    : 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
}

function getGroupLabel(group?: string | null): string {
  if (!group) return '—'
  return GROUP_LABELS[group] ?? group
}

export default function InjuriesPage() {
  const nav = useNavigate()

  const [statusFilter, setStatusFilter] = useState<'ALL' | InjuryStatus>('ACTIVE')
  const [groupFilter, setGroupFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const queryKey = useMemo(
    () => ['injuries', { status: statusFilter, group: groupFilter, search }] as const,
    [statusFilter, groupFilter, search]
  )

  const {
    data: injuries = [],
    isLoading,
    isError,
    error,
  } = useQuery<Injury[]>({
    queryKey,
    queryFn: () =>
      fetchInjuries({
        status: statusFilter,
        group: groupFilter,
        search,
      }),
    keepPreviousData: true,
  })

  const isEmpty = !isLoading && injuries.length === 0

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleGroupChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setGroupFilter(e.target.value || 'ALL')
  }

  const handleStatusChange = (value: 'ALL' | InjuryStatus) => {
    setStatusFilter(value)
  }

  const sortedInjuries = useMemo(
    () =>
      [...injuries].sort((a, b) => {
        // сортируем по дате возникновения (новые сверху)
        const ad = new Date(a.date).getTime()
        const bd = new Date(b.date).getTime()
        return bd - ad
      }),
    [injuries]
  )

  return (
    <div className="p-6 space-y-6">
      {/* Шапка */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-50">
            Состояние здоровья
          </h1>
          <p className="text-sm text-slate-400">
            Общий список травм всех спортсменов. Нажми на строку, чтобы открыть подробности.
          </p>
        </div>

        {/* Фильтры */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Статус */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Статус
            </span>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => {
                const active = statusFilter === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleStatusChange(s.value)}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold transition border',
                      active
                        ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500',
                    ].join(' ')}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Группа */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-slate-400">
              Группа
            </label>
            <select
              value={groupFilter}
              onChange={handleGroupChange}
              className="min-w-[160px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-50 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="ALL">Все группы</option>
              <option value="JUNIORS">Юниоры</option>
              <option value="SENIORS">Старшие</option>
            </select>
          </div>

          {/* Поиск */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase text-slate-400">
              Поиск по ФИО / типу травмы
            </label>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Начните вводить..."
              className="w-56 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-50 shadow-sm placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>
      </header>

      {/* Карточка со списком */}
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow">
        {isLoading && (
          <div className="p-6 text-sm text-slate-400">
            Загрузка списка травм...
          </div>
        )}

        {isError && !isLoading && (
          <div className="p-6 text-sm text-red-400">
            Ошибка загрузки травм:{' '}
            {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          </div>
        )}

        {isEmpty && !isLoading && !isError && (
          <div className="p-6 text-sm text-slate-400">
            Травм не найдено для выбранных фильтров.
          </div>
        )}

        {!isLoading && !isError && sortedInjuries.length > 0 && (
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
                  Тип травмы
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Статус
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedInjuries.map((injury, idx) => (
                <tr
                  key={injury.id}
                  onClick={() => nav(`/injuries/${injury.id}`)}
                  className={[
                    'cursor-pointer border-t border-slate-800 transition',
                    idx % 2 === 0
                      ? 'bg-slate-900/40 hover:bg-slate-800/60'
                      : 'bg-slate-900/20 hover:bg-slate-800/60',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 align-middle text-slate-50">
                    {injury.fullName}
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-200">
                    {getGroupLabel(injury.group)}
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-200">
                    {injury.type}
                  </td>
                  <td className="px-4 py-3 align-middle text-slate-200">
                    {formatDate(injury.date)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span
                      className={[
                        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                        statusBadgeClasses(injury.status),
                      ].join(' ')}
                    >
                      {statusLabel(injury.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <span className="text-xs text-slate-400">
                      Нажмите строку для деталей →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
