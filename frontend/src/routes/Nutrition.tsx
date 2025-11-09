import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAthletes } from '@/services/athletes'
import { getNutrition } from '@/services/nutrition'
import { t } from '@/i18n/ru'
import Avatar from '@/components/Avatar'

export default function Nutrition() {
  const [group, setGroup] = useState('')
  const [date, setDate] = useState('')

  const { data: athletes } = useQuery({
    queryKey: ['athletes', group],
    queryFn: () => getAthletes({ group: group || (undefined as any) }),
  })

  const { data: allNut } = useQuery({
    queryKey: ['nutrition', 'all', group],
    queryFn: () => getNutrition({}),
  })

  const rows = useMemo(() => {
    const a = athletes?.items || []
    const map = new Map<
      string,
      { weight?: number; notes?: string; flag?: string; date: string }
    >()

    ;(allNut?.items || []).forEach((n) => {
      const prev = map.get(n.athleteId)
      if (!prev || n.date > prev.date)
        map.set(n.athleteId, {
          weight: n.weightKg,
          notes: n.notes,
          flag: n.flag,
          date: n.date,
        })
    })

    return a
      .map((x) => ({ athlete: x, data: map.get(x.id) }))
      .filter((r) => !date || r.data?.date === date)
  }, [athletes, allNut, date])

  return (
    <div className="p-6 space-y-4 text-[var(--color-text)]">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-[var(--color-muted)]">
          {t('common.date')}
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-primary)]"
        />
        <label className="text-sm text-[var(--color-muted)]">
          {t('common.group')}
        </label>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="px-3 py-2 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-primary)]"
        >
          <option value="">Все</option>
          <option value="Юниоры">Юниоры</option>
          <option value="Старшие">Старшие</option>
        </select>
      </div>

      <div className="card-dark overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-surface)]">
            <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2 text-[var(--color-muted)]">
              <th>Фото</th>
              <th>Имя</th>
              <th>Статус еды</th>
              <th>Вес</th>
              <th>Примечания</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr
                  key={r.athlete.id}
                  className="border-t border-[var(--color-border)] [&>td]:px-4 [&>td]:py-2 hover:bg-[var(--color-surface)]/80"
                >
                  <td>
                    <Avatar
                      name={r?.athlete?.fullName}
                      src={(r.athlete as any)?.photo}
                      size={36}
                    />
                  </td>

                  <td>{r?.athlete?.fullName || 'Неизвестный спортсмен'}</td>

                  <td>
                    {r.data?.flag ? (
                      <span
                        className={`px-2 py-1 rounded-2xl text-xs ${
                          r.data.flag === 'ОК'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {r.data.flag === 'ОК' ? 'В норме' : 'Низкий уровень'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td>{r.data?.weight ?? '—'}</td>
                  <td className="max-w-[24rem] truncate">
                    {r.data?.notes ?? '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-[var(--color-muted)]"
                >
                  {t('common.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
