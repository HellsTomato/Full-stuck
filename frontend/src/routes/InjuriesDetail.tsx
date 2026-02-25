// frontend/src/routes/InjuriesDetail.tsx

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import type { Injury, InjuryStatus } from '@/styles/types'
import { useAuth } from '@/context/auth'
import {
  deleteInjury,
  fetchInjury,
  updateInjuryStatus,
} from '@/services/injuries'

function formatDate(date?: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  const dd = d.getDate().toString().padStart(2, '0')
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function calcAge(birth?: string | null): string {
  if (!birth) return '—'
  const d = new Date(birth)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) {
    age--
  }
  return `${age}`
}

function statusLabel(status: InjuryStatus): string {
  return status === 'ACTIVE' ? 'Активная' : 'Закрыта'
}

function statusBadgeClasses(status: InjuryStatus): string {
  if (status === 'ACTIVE') {
    // активная (желтая)
    return 'border-amber-400/60 bg-amber-500/10 text-amber-200'
  }
  // закрыта (зелёная)
  return 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
}

export default function InjuriesDetailPage() {
  const { role } = useAuth()
  const isTrainer = role === 'TRAINER'
  const params = useParams()
  // поддерживаем и /injuries/:injuryId, и /injuries/:id
  const idParam = params.injuryId ?? params.id ?? null
  const id = idParam ? Number(idParam) : NaN

  const nav = useNavigate()
  const queryClient = useQueryClient()

  const [isStatusDialogOpen, setStatusDialogOpen] = useState(false)
  const [closedDateInput, setClosedDateInput] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )

  // если id некорректный — даже не пытаемся дергать бэк
  if (Number.isNaN(id)) {
    return (
      <div className="p-6 space-y-3 text-sm text-slate-200">
        <div className="text-red-400">
          Неверный адрес травмы: не указан корректный идентификатор.
        </div>
        <button
          type="button"
          onClick={() => nav('/injuries')}
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-600"
        >
          ← Назад к списку травм
        </button>
      </div>
    )
  }

  // === загрузка травмы ===
  const {
    data: injury,
    isLoading,
    isError,
    error,
  } = useQuery<Injury>({
    queryKey: ['injury', id],
    enabled: !Number.isNaN(id),
    queryFn: () => fetchInjury(id),
  })

  // === мутация удаления ===
  const deleteMutation = useMutation({
    mutationFn: () => deleteInjury(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injuries'] })
      nav('/injuries')
    },
  })

  // === мутация смены статуса ===
  const statusMutation = useMutation({
    mutationFn: async (payload: {
      status: InjuryStatus
      closedDate?: string | null
    }) => updateInjuryStatus(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['injury', id], updated)
      queryClient.invalidateQueries({ queryKey: ['injuries'] })
      setStatusDialogOpen(false)
    },
  })

  const handleDelete = () => {
    if (deleteMutation.isPending) return
    if (!window.confirm('Удалить эту травму? Действие необратимо.')) return
    deleteMutation.mutate()
  }

  const handleOpenStatusDialog = () => {
    if (!injury) return
    if (injury.closedDate) {
      setClosedDateInput(injury.closedDate.slice(0, 10))
    } else {
      setClosedDateInput(new Date().toISOString().slice(0, 10))
    }
    setStatusDialogOpen(true)
  }

  const handleConfirmStatusChange = () => {
    if (!injury) return
    if (statusMutation.isPending) return

    if (injury.status === 'ACTIVE') {
      statusMutation.mutate({
        status: 'CLOSED',
        closedDate: closedDateInput,
      })
    } else {
      statusMutation.mutate({
        status: 'ACTIVE',
        closedDate: null,
      })
    }
  }

  const isClosed = injury?.status === 'CLOSED'
  const age = useMemo(() => calcAge(injury?.birthDate ?? null), [injury])

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-slate-400">
        Загрузка данных травмы...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-red-400">
        Не удалось загрузить травму:{' '}
        {error instanceof Error ? error.message : 'неизвестная ошибка'}
      </div>
    )
  }

  if (!injury) {
    return (
      <div className="p-6 text-sm text-red-400">
        Травма не найдена или была удалена.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* верхняя панель */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => nav('/injuries')}
            className="mb-2 text-xs text-slate-400 hover:text-slate-200"
          >
            ← Назад к списку травм
          </button>
          <h1 className="text-2xl font-semibold text-slate-50">
            Травма спортсмена
          </h1>
          <p className="text-sm text-slate-400">
            Подробная информация и управление статусом.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isTrainer ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-lg border border-red-500/70 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 shadow-sm transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить травму'}
              </button>

              <button
                type="button"
                onClick={handleOpenStatusDialog}
                disabled={statusMutation.isPending}
                className="rounded-lg border border-violet-500/80 bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-100 shadow-sm transition hover:bg-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {injury.status === 'ACTIVE'
                  ? 'Закрыть травму'
                  : 'Сделать активной снова'}
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400">Доступен только просмотр</span>
          )}
        </div>
      </div>

      {/* карточка с инфой */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-50">
              {injury.fullName}
            </div>
            <div className="text-sm text-slate-400">
              Группа: {injury.group || '—'} • Возраст: {age}
            </div>
          </div>

          <span
            className={[
              'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
              statusBadgeClasses(injury.status),
            ].join(' ')}
          >
            {statusLabel(injury.status)}
          </span>
        </div>

        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Тип травмы
            </dt>
            <dd className="mt-1 text-slate-50">{injury.type}</dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Дата возникновения
            </dt>
            <dd className="mt-1 text-slate-50">
              {formatDate(injury.date)}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Дата закрытия
            </dt>
            <dd className="mt-1 text-slate-50">
              {isClosed ? formatDate(injury.closedDate ?? undefined) : '—'}
            </dd>
          </div>

          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">
              Статус
            </dt>
            <dd className="mt-1 text-slate-50">
              {statusLabel(injury.status)}
            </dd>
          </div>
        </dl>

        {injury.notes && (
          <div className="mt-6">
            <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
              Примечания
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-slate-950/40 p-3 text-sm text-slate-100">
              {injury.notes}
            </pre>
          </div>
        )}
      </section>

      {/* мини-диалог выбора даты закрытия */}
      {isTrainer && isStatusDialogOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <h2 className="mb-2 text-base font-semibold text-slate-50">
              {injury.status === 'ACTIVE'
                ? 'Закрыть травму'
                : 'Сделать травму активной'}
            </h2>
            {injury.status === 'ACTIVE' ? (
              <>
                <p className="mb-3 text-sm text-slate-400">
                  Выберите дату закрытия травмы (по умолчанию — сегодня).
                </p>
                <input
                  type="date"
                  value={closedDateInput}
                  onChange={(e) => setClosedDateInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-50 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </>
            ) : (
              <p className="mb-3 text-sm text-slate-400">
                Травма будет снова отмечена как активная, дата закрытия
                очистится.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusDialogOpen(false)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={statusMutation.isPending}
                className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusMutation.isPending ? 'Сохранение...' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
