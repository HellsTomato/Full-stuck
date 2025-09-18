import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAthletes } from '@/services/athletes'
import { getNutrition } from '@/services/nutrition'
import { t } from '@/i18n/ru'
import Avatar from '@/components/Avatar' // ✅ дефолтный импорт

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
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">{t('common.date')}</label>
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
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2">
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
                  className="border-t [&>td]:px-4 [&>td]:py-2 hover:bg-gray-50"
                >
                  {/* ✅ безопасный Avatar */}
                  <td>
                    <Avatar
                      name={r?.athlete?.fullName}
                      src={(r.athlete as any)?.photo}
                      size={36}
                    />
                  </td>

                  {/* ✅ безопасное имя */}
                  <td>{r?.athlete?.fullName || 'Неизвестный спортсмен'}</td>

                  <td>
                    {r.data?.flag ? (
                      <span
                        className={`px-2 py-1 rounded-2xl text-xs ${
                          r.data.flag === 'ОК'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {r.data.flag === 'ОК'
                          ? 'В норме'
                          : 'Низкий уровень'}
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
                <td colSpan={5} className="p-4 text-center text-gray-500">
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
