
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWeeklyPlan, copyWeek } from '@/services/weeklyPlan'
import { t } from '@/i18n/ru'
import { useToast } from '@/components/Toast'

function weekStartISO(date = new Date()){
  const d = new Date(date); d.setDate(d.getDate() - ((d.getDay()+6)%7)); d.setHours(0,0,0,0); return d.toISOString().slice(0,10)
}

export default function WeeklyPlan(){
  const qc = useQueryClient()
  const [group, setGroup] = useState('')
  const [weekStart, setWeekStart] = useState(weekStartISO())
  const { data, isLoading } = useQuery({ queryKey: ['weekly', weekStart, group], queryFn: ()=> getWeeklyPlan({ weekStart, group }) })
  const toast = useToast()
  const mut = useMutation({ mutationFn: copyWeek, onSuccess: ()=>{ qc.invalidateQueries({ queryKey:['weekly']}); toast.push(t('common.successSave')) } })

  const days = Array.from({length:7}).map((_,i)=>{
    const d = new Date(weekStart); d.setDate(d.getDate()+i); return d.toISOString().slice(0,10)
  })

  function onCopy(){
    if (!confirm(t('common.confirmOverwrite'))) return
    const from = new Date(weekStart); from.setDate(from.getDate()-7)
    mut.mutate({ fromWeek: from.toISOString().slice(0,10), toWeek: weekStart, group, overwrite: true })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">Неделя</label>
        <input type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)} className="px-3 py-2 border rounded-2xl"/>
        <label className="text-sm">{t('common.group')}</label>
        <select value={group} onChange={e=>setGroup(e.target.value)} className="px-3 py-2 border rounded-2xl">
          <option value="">Все</option>
          <option value="Юниоры">Юниоры</option>
          <option value="Старшие">Старшие</option>
        </select>
        <button onClick={onCopy} className="px-3 py-2 rounded-2xl bg-accent text-white">{t('actions.copyWeek')}</button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {isLoading? <div className="p-4">{t('common.loading')}</div> :
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="[&>th]:text-left [&>th]:px-4 [&>th]:py-2">
                <th>Дата</th><th>Время</th><th>Тип</th><th>Нагрузка</th><th>Группа</th><th>Заметки</th>
              </tr>
            </thead>
            <tbody>
              {days.map(d=> data?.items?.filter(s=>s.date===d).map(s=>(
                <tr key={s.id} className="border-t [&>td]:px-4 [&>td]:py-2">
                  <td>{s.date}</td><td>{s.time}</td><td>{s.type}</td><td>{s.load||'—'}</td><td>{s.group}</td><td>{s.notes||'—'}</td>
                </tr>
              )))}
            </tbody>
          </table>
        }
      </div>
    </div>
  )
}
