// src/routes/Athletes.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthletes, createAthlete, updateAthlete } from '@/services/athletes'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'

const schema = z.object({
  fullName: z.string().min(1, 'Укажите ФИО'),
  birthDate: z.string().min(1, 'Укажите дату рождения'),
  group: z.string().min(1, 'Укажите группу'),
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
  const toast = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['athletes', search, group],
    queryFn: () => getAthletes({ search, group }),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const createMut = useMutation({
    mutationFn: createAthlete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] })
      toast.success("Сохранено")
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<FormValues> }) =>
      updateAthlete(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athletes'] })
      toast.success("Сохранено")
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
    <div className="p-6 space-y-4 text-[var(--color-text)]">
      <Topbar onSearch={setSearch}>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--color-muted)]">Группа</label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="input"
          >
            <option value="">Все</option>
            <option value="Юниоры">Юниоры</option>
            <option value="Старшие">Старшие</option>
          </select>
        </div>

        <button onClick={onAdd} className="btn rounded-2xl text-sm">
          Добавить спортсмена
        </button>
      </Topbar>

      <div className="card-dark overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-[var(--color-muted)]">Загрузка…</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-[var(--color-surface)]">
              <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2 text-[var(--color-muted)]">
                <th>ФИО</th>
                <th>Группа</th>
                <th>Телефон</th>
                <th>Дата рождения</th>
                <th>Примечания</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {data?.items?.length ? (
                data.items.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]/80">
                    <td className="px-4 py-2">
                      <Link to={`/athletes/${a.id}`} className="text-[var(--color-primary)]">
                        {a.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{a.group}</td>
                    <td className="px-4 py-2">{a.phone || '—'}</td>
                    <td className="px-4 py-2">{a.birthDate || '—'}</td>
                    <td className="px-4 py-2 max-w-[20rem] truncate">{a.notes || '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => onEdit(a.id)}
                        className="btn-outline text-sm rounded-2xl px-3 py-1.5"
                      >
                        Изменить
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-[var(--color-muted)]">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <form onSubmit={handleSubmit(onSubmit)} className="card-dark w-full max-w-lg p-4">
            <div className="text-lg font-semibold mb-3">
              {editId ? "Редактировать спортсмена" : "Добавить спортсмена"}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ФИО" error={errors.fullName?.message}>
                <input {...register("fullName")} className="input" />
              </Field>

              <Field label="Дата рождения" error={errors.birthDate?.message}>
                <input type="date" {...register("birthDate")} className="input" />
              </Field>

              <Field label="Группа" error={errors.group?.message}>
                <select {...register("group")} className="input">
                  <option value="">Выберите…</option>
                  <option value="Юниоры">Юниоры</option>
                  <option value="Старшие">Старшие</option>
                </select>
              </Field>

              <Field label="Телефон">
                <input {...register("phone")} className="input" />
              </Field>

              <Field label="Примечания" full>
                <textarea {...register("notes")} rows={3} className="input" />
              </Field>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-outline rounded-2xl">
                Отмена
              </button>
              <button type="submit" className="btn rounded-2xl">
                Сохранить
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  error,
  children,
  full,
}: {
  label: string
  error?: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-sm text-[var(--color-muted)]">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export function Topbar({
  onSearch,
  children,
}: {
  onSearch: (s: string) => void
  children: React.ReactNode
}) {
  const [v, setV] = useState('')

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex-1">
        <input
          placeholder="Поиск"
          className="input"
          value={v}
          onChange={(e) => {
            setV(e.target.value)
            setTimeout(() => onSearch(e.target.value), 300)
          }}
        />
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
