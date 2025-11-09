// src/routes/Dashboard.tsx
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWeeklyPlan } from '@/services/weeklyPlan'
import { getAttendance } from '@/services/attendance'
import { getAthletes } from '@/services/athletes'
import { useNavigate } from 'react-router-dom'

function iso(d: Date) { return d.toISOString().slice(0, 10) }
function isoToday() { return iso(new Date()) }
function mondayOf(date = new Date()) {
  const d = new Date(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // понедельник
  d.setHours(0, 0, 0, 0)
  return d
}
const DAYS = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ']

export default function Dashboard() {
  const nav = useNavigate()
  const [group, setGroup] = useState('Юниоры')
  const today = isoToday()

  // Группы из спортсменов
  const { data: athletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => getAthletes({})
  })
  const groups = useMemo(
    () => Array.from(new Set((athletes?.items || []).map(a => a.group))),
    [athletes]
  )

  // План недели
  const weekStartForApi = iso(mondayOf())
  const { data: plan } = useQuery({
    queryKey: ['weekly-plan', weekStartForApi, group],
    queryFn: () => getWeeklyPlan({ weekStart: weekStartForApi, group }),
  })

  // Посещаемость сегодня по группе
  const { data: attend } = useQuery({
    queryKey: ['attendance', today, group],
    queryFn: () => getAttendance({ date: today, group }),
  })

  // Сегодняшняя тренировка
  const todaySession = useMemo(
    () => plan?.items.find(s => s.date === today && (!group || s.group === group)),
    [plan, today, group]
  )

  const present = useMemo(
    () => (attend?.items || []).filter(a => a.status === 'Присутствовал' || a.status === 'Опоздал').length,
    [attend]
  )
  const absent = useMemo(
    () => (attend?.items || []).filter(a => a.status === 'Отсутствовал').length,
    [attend]
  )

  // Неделя = 7 дней от сегодня
  const weekCells = useMemo(() => {
    const base = new Date(today)
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const isoD = iso(d)
      const has = plan?.items.some(s => s.date === isoD && (!group || s.group === group))
      const label = `${DAYS[d.getDay()]}`
      const dayNum = d.getDate()
      const isToday = isoD === today
      return { iso: isoD, label, dayNum, has, isToday }
    })
  }, [plan, today, group])

  return (
    <div className="p-4 md:p-6 space-y-4 text-[var(--color-text)]">
      {/* Верхняя строка */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
        {/* Сегодняшняя тренировка */}
        <div className="card-dark">
          <div className="px-4 py-2 border-b border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)]">
            Сегодняшняя тренировка
          </div>
          <div className="p-4 text-sm">
            {todaySession ? (
              <>
                <div className="mb-3 text-[var(--color-text)]">
                  {todaySession.time || '—'}
                </div>
                <div className="text-[var(--color-text)]">
                  Присутствуют: <b>{present}</b> чел.
                </div>
                <div className="text-[var(--color-text)]">
                  Отсутствуют: <b>{absent}</b> чел.
                </div>
              </>
            ) : (
              <div className="text-[var(--color-muted)]">
                На сегодня тренировка не запланирована
              </div>
            )}
          </div>
        </div>

        {/* Группа + Неделя (от сегодня) */}
        <div className="space-y-3">
          {/* выбор группы */}
          <div className="card-dark p-3 flex items-center gap-2">
            <label className="text-sm text-[var(--color-muted)]">Группа:</label>
            <select
              className="px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-primary)]"
              value={group}
              onChange={e => setGroup(e.target.value)}
            >
              {groups.length
                ? groups.map(g => <option key={g} value={g}>{g}</option>)
                : <option>—</option>}
            </select>
          </div>

          {/* неделя */}
          <div className="card-dark">
            <div className="px-4 py-2 border-b border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)]">
              Неделя
            </div>
            <div className="p-3 grid grid-cols-7 gap-1">
              {weekCells.map(c => (
                <div
                  key={c.iso}
                  className={[
                    "h-12 grid place-items-center rounded-md border text-xs leading-tight px-1 text-center",
                    c.isToday
                      ? "border-[var(--color-primary)] bg-[var(--color-surface)]"
                      : "border-[var(--color-border)]",
                    c.has ? "bg-[var(--color-border)]" : ""
                  ].join(' ')}
                  title={c.iso}
                >
                  <div className="font-medium text-[var(--color-text)]">
                    {c.label}
                  </div>
                  <div className="text-[10px] text-[var(--color-muted)]">
                    {c.dayNum}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="card-dark">
        <div className="px-4 py-2 border-b border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)]">
          Быстрые действия
        </div>
        <div className="p-3 flex flex-col md:flex-row gap-2">
          <button
            onClick={() => nav('/attendance')}
            className="btn-outline text-sm"
          >
            Отметить посещаемость
          </button>
          <button
            onClick={() => nav('/injuries')}
            className="btn-outline text-sm"
          >
            Добавить травму
          </button>
          <button
            onClick={() => nav('/reports')}
            className="btn-outline text-sm"
          >
            Сформировать отчёт
          </button>
        </div>
      </div>
    </div>
  )
}
