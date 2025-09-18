// src/routes/Injuries.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getInjuries, createInjury, updateInjury } from '@/services/injuries'
import { getAthletes } from '@/services/athletes'
import { useState } from 'react'
import { t } from '@/i18n/ru'
import { StatusPill } from '@/components/StatusPill'
import { useToast } from '@/components/Toast'

export default function Injuries() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')

  const injuriesQ = useQuery({
    queryKey: ['injuries', status],
    queryFn: () => getInjuries({ status: (status || undefined) as any }),
  })

  const athletesQ = useQuery({
    queryKey: ['athletes'],
    queryFn: () => getAthletes({}),
  })

  const athletes = athletesQ.data?.items ?? []

  const [form, setForm] = useState({
    open: false,
    athleteId: '',
    kind: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const toast = useToast()

  const createMut = useMutation({
    mutationFn: createInjury,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['injuries'] })
      toast.push(t('common.successSave'))
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => updateInjury(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['injuries'] })
      toast.push(t('common.successSave'))
    },
  })

  function submit() {
    if (!form.athleteId || !form.kind) return toast.push(t('common.errorSave'), 'error')
    createMut.mutate({
      athleteId: form.athleteId,
      kind: form.kind,
      date: form.date,
      status: 'Активная',
    })
    setForm((f) => ({ ...f, open: false }))
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm">{t('common.status')}</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 border rounded-2xl"
        >
          <option value="">Все</option>
          <option value="Активная">Активная</option>
          <option value="Закрыта">Закрыта</option>
        </select>
        <button
          onClick={() => setForm((f) => ({ ...f, open: true }))}
          className="ml-auto px-3 py-2 rounded-2xl bg-accent text-white"
        >
          {t('actions.add')} травму
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {injuriesQ.isLoading ? (
          <div className="p-4">{t('common.loading')}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2">
                <th>Спортсмен</th>
                <th>Тип</th>
                <th>Дата</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {injuriesQ.data?.items?.length ? (
                injuriesQ.data.items.map((i) => (
                  <tr key={i.id} className="border-t [&>td]:px-4 [&>td]:py-2 hover:bg-gray-50">
                    <td>
                      {(() => {
                        const a = athletes.find((x) => x.id === i.athleteId)
                        return a ? (
                          a.fullName
                        ) : (
                          <span className="text-gray-400 italic">спортсмен не найден</span>
                        )
                      })()}
                    </td>
                    <td>{i.kind}</td>
                    <td>{i.date}</td>
                    <td><StatusPill status={i.status} /></td>
                    <td className="text-right">
                      {i.status === 'Активная' ? (
                        <button
                          onClick={() => updateMut.mutate({ id: i.id, body: { status: 'Закрыта' } })}
                          className="px-2 py-1 rounded-2xl border hover:bg-gray-50"
                        >
                          Закрыть
                        </button>
                      ) : (
                        <button
                          onClick={() => updateMut.mutate({ id: i.id, body: { status: 'Активная' } })}
                          className="px-2 py-1 rounded-2xl border hover:bg-gray-50"
                        >
                          Открыть
                        </button>
                      )}
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
        )}
      </div>

      {form.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow p-4 w-full max-w-lg">
            <div className="text-lg font-semibold mb-3">Добавить травму</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Спортсмен</label>
                <select
                  value={form.athleteId}
                  onChange={(e) => setForm((f) => ({ ...f, athleteId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-2xl"
                  disabled={athletesQ.isLoading || athletes.length === 0}
                >
                  <option value="">{athletesQ.isLoading ? 'Загрузка…' : 'Выберите…'}</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm">Тип</label>
                <input
                  value={form.kind}
                  onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-2xl"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Дата</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-2xl"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setForm((f) => ({ ...f, open: false }))} className="px-3 py-2 rounded-2xl border">Отмена</button>
              <button onClick={submit} className="px-3 py-2 rounded-2xl bg-accent text-white">{t('actions.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
