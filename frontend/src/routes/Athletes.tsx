import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthletes, createAthlete, updateAthlete } from '@/services/athletes'
import { t } from '@/i18n/ru'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'

const schema = z.object({
  fullName: z.string().min(1, "Укажите ФИО"),
  birthDate: z.string().min(1, "Укажите дату рождения"),
  group: z.string().min(1, "Укажите группу"),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function Athletes() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [group, setGroup] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['athletes', search, group],
    queryFn: () => getAthletes({ search, group }),
  })
  const toast = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const createMut = useMutation({
    mutationFn: createAthlete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] })
      toast.push(t('common.successSave'))
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<FormValues> }) =>
      updateAthlete(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] })
      toast.push(t('common.successSave'))
    },
  })

  function onAdd() {
    setEditId(null)
    reset({ fullName: '', birthDate: '', group: '', phone: '', notes: '' })
    setOpen(true)
  }

  function onEdit(id: string) {
    const a = data?.items.find((x) => x.id === id)
    if (!a) return
    setEditId(id)
    reset({
      fullName: a.fullName,
      birthDate: a.birthDate,
      group: a.group,
      phone: a.phone,
      notes: a.notes,
    })
    setOpen(true)
  }

  function onSubmit(values: FormValues) {
    if (editId) updateMut.mutate({ id: editId, body: values })
    else createMut.mutate(values)
    setOpen(false)
  }

  return (
    <div className="p-6 space-y-4">
      <Topbar onSearch={setSearch}>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t('common.group')}</label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="px-2 py-1 border rounded-2xl"
          >
            <option value="">Все</option>
            <option value="Юниоры">Юниоры</option>
            <option value="Старшие">Старшие</option>
          </select>
        </div>
        <button
          onClick={onAdd}
          className="px-3 py-2 rounded-2xl bg-accent text-white"
        >
          {t('actions.add')} спортсмена
        </button>
      </Topbar>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {isLoading ? (
          <div className="p-4">{t('common.loading')}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2">
                <th>ФИО</th>
                <th>Группа</th>
                <th>Телефон</th>
                <th>Примечания</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.length ? (
                data.items.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t [&>td]:px-4 [&>td]:py-2 hover:bg-gray-50"
                  >
                    {/* ✅ ССЫЛКА НА ПРОФИЛЬ */}
                    <td>
                      <Link
                        to={`/athletes/${a.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {a.fullName}
                      </Link>
                    </td>
                    <td>{a.group}</td>
                    <td>{a.phone || '—'}</td>
                    <td className="max-w-[24rem] truncate">{a.notes || '—'}</td>
                    <td className="text-right">
                      <button
                        onClick={() => onEdit(a.id)}
                        className="px-2 py-1 rounded-2xl border hover:bg-gray-50"
                      >
                        {t('actions.edit')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4 text-center text-gray-500"
                  >
                    {t('common.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Диалог добавления/редактирования */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white rounded-2xl shadow p-4 w-full max-w-lg"
          >
            <div className="text-lg font-semibold mb-3">
              {editId ? 'Редактировать спортсмена' : 'Добавить спортсмена'}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">ФИО</label>
                <input
                  className="w-full px-3 py-2 border rounded-2xl"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-red-600 text-xs">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm">Дата рождения</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-2xl"
                  {...register('birthDate')}
                />
                {errors.birthDate && (
                  <p className="text-red-600 text-xs">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm">Группа</label>
                <select
                  className="w-full px-3 py-2 border rounded-2xl"
                  {...register('group')}
                >
                  <option value="">Выберите…</option>
                  <option value="Юниоры">Юниоры</option>
                  <option value="Старшие">Старшие</option>
                </select>
                {errors.group && (
                  <p className="text-red-600 text-xs">
                    {errors.group.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm">Телефон</label>
                <input
                  className="w-full px-3 py-2 border rounded-2xl"
                  {...register('phone')}
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm">Примечания</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-2xl"
                  rows={3}
                  {...register('notes')}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-2xl border"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-3 py-2 rounded-2xl bg-accent text-white"
              >
                {t('actions.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export function Topbar({ onSearch, children }: { onSearch: (s: string) => void; children?: React.ReactNode }) {
  const [v, setV] = useState('')
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex-1">
        <input
          placeholder={t('common.search')}
          className="w-full px-3 py-2 border rounded-2xl"
          value={v}
          onChange={(e) => {
            setV(e.target.value)
            const s = e.target.value
            setTimeout(() => onSearch(s), 300)
          }}
        />
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
