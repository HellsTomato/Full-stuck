// src/routes/Attendance.tsx
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAthletes } from '@/services/athletes'
import { getAttendance, postAttendanceBulk } from '@/services/attendance'
import { t } from '@/i18n/ru'
import { useToast } from '@/components/Toast'

type Status = 'Присутствовал' | 'Опоздал' | 'Отсутствовал'

function todayISO() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function Attendance() {
  const qc = useQueryClient()
  const toast = useToast()

  const [date, setDate] = useState<string>(todayISO())
  const [group, setGroup] = useState<string>('')

  // спортсмены
  const athletesQ = useQuery({
    queryKey: ['athletes', group],
    queryFn: () => getAthletes({ group: group || (undefined as any) }),
  })
  const athletes = athletesQ.data?.items ?? []

  // посещаемость по дате/группе
  const attQ = useQuery({
    queryKey: ['attendance', date, group],
    queryFn: () => getAttendance({ date, group: group || (undefined as any) }),
    enabled: !!date,
  })
  const attItems = attQ.data?.items ?? []

  // строим строки для таблицы:
  // если из API пришли записи — используем их.
  // если нет (например, тренировки нет), строим пустые строки на основе списка спортсменов группы,
  // но кнопки отметки будут выключены (нет sessionId).
  const rows = useMemo(() => {
    // sessionId для выбранной даты/группы (берём любой из пришедших записей)
    const fallbackSessionId = attItems[0]?.sessionId || null

    // индекс по athleteId -> запись посещаемости
    const map = new Map<string, typeof attItems[number]>()
    attItems.forEach((a) => map.set(a.athleteId, a))

    const source =
      attItems.length > 0
        ? // когда есть данные — показываем только тех, кто в них есть
          Array.from(new Set(attItems.map((x) => x.athleteId))).map((id) => {
            const a = athletes.find((p) => p.id === id)
            const rec = map.get(id)
            return {
              athleteId: id,
              sessionId: rec?.sessionId ?? fallbackSessionId,
              status: rec?.status as Status | undefined,
              name: a?.fullName,
              grp: a?.group,
            }
          })
        : // когда на дату нет записей — строим список по спортсменам группы
          athletes
            .filter((a) => !group || a.group === group)
            .map((a) => ({
              athleteId: a.id,
              sessionId: fallbackSessionId, // может быть null
              status: undefined,
              name: a.fullName,
              grp: a.group,
            }))

    return source
  }, [attItems, athletes, group])

  // сохранение (bulk)
  const bulkMut = useMutation({
    mutationFn: (payload: {
      date: string
      group?: string
      items: { athleteId: string; sessionId: string; status: Status }[]
    }) => postAttendanceBulk(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: () => toast.push(t('common.errorSave'), 'error'),
  })

  // отметить одного
  function mark(athleteId: string, status: Status) {
    const row = rows.find((r) => r.athleteId === athleteId)
    if (!row?.sessionId) {
      toast.push('На выбранную дату нет тренировки — нечего отмечать', 'error')
      return
    }
    bulkMut.mutate({
      date,
      group: group || undefined,
      items: [{ athleteId, sessionId: row.sessionId, status }],
    })
  }

  // отметить всех
  function bulkMark(status: Status) {
    const withSession = rows.filter((r) => r.sessionId)
    if (withSession.length === 0) {
      toast.push('На выбранную дату нет тренировки — нечего отмечать', 'error')
      return
    }
    bulkMut.mutate({
      date,
      group: group || undefined,
      items: withSession.map((r) => ({
        athleteId: r.athleteId,
        sessionId: r.sessionId as string,
        status,
      })),
    })
  }

  const noSession = rows.every((r) => !r.sessionId)

  return (
    <div className="p-6 space-y-4">
      {/* Панель фильтров */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Дата</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border rounded-2xl"
        />

        <label className="text-sm">{t('common.group')}</label>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="px-3 py-2 border rounded-2xl"
        >
          <option value="">Все</option>
          <option value="Юниоры">Юниоры</option>
          <option value="Старшие">Старшие</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => bulkMark('Присутствовал')}
            className="px-3 py-2 rounded-2xl border"
            disabled={noSession || bulkMut.isPending}
            title={noSession ? 'На эту дату нет тренировки' : ''}
          >
            Присутствовал
          </button>
          <button
            onClick={() => bulkMark('Опоздал')}
            className="px-3 py-2 rounded-2xl border"
            disabled={noSession || bulkMut.isPending}
            title={noSession ? 'На эту дату нет тренировки' : ''}
          >
            Опоздал
          </button>
          <button
            onClick={() => bulkMark('Отсутствовал')}
            className="px-3 py-2 rounded-2xl border"
            disabled={noSession || bulkMut.isPending}
            title={noSession ? 'На эту дату нет тренировки' : ''}
          >
            Отсутствовал
          </button>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {attQ.isLoading ? (
          <div className="p-4">{t('common.loading')}</div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[40%]" />
            </colgroup>
            <thead className="bg-gray-50">
              <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2">
                <th>ФИО</th>
                <th>Группа</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr
                    key={r.athleteId}
                    className="border-t [&>td]:px-4 [&>td]:py-2 hover:bg-gray-50"
                  >
                    <td className="truncate">
                      {r.name || 'Неизвестный спортсмен'}
                    </td>
                    <td className="truncate">{r.grp || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => mark(r.athleteId, 'Присутствовал')}
                          className={`px-3 py-1 rounded-2xl border ${
                            r.status === 'Присутствовал'
                              ? 'bg-green-50 border-green-300'
                              : ''
                          }`}
                          disabled={!r.sessionId || bulkMut.isPending}
                          title={!r.sessionId ? 'Нет тренировки' : ''}
                        >
                          Присутствовал
                        </button>
                        <button
                          onClick={() => mark(r.athleteId, 'Опоздал')}
                          className={`px-3 py-1 rounded-2xl border ${
                            r.status === 'Опоздал'
                              ? 'bg-yellow-50 border-yellow-300'
                              : ''
                          }`}
                          disabled={!r.sessionId || bulkMut.isPending}
                          title={!r.sessionId ? 'Нет тренировки' : ''}
                        >
                          Опоздал
                        </button>
                        <button
                          onClick={() => mark(r.athleteId, 'Отсутствовал')}
                          className={`px-3 py-1 rounded-2xl border ${
                            r.status === 'Отсутствовал'
                              ? 'bg-red-50 border-red-300'
                              : ''
                          }`}
                          disabled={!r.sessionId || bulkMut.isPending}
                          title={!r.sessionId ? 'Нет тренировки' : ''}
                        >
                          Отсутствовал
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    {t('common.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
