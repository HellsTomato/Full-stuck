import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAthletes } from '@/services/athletes'
import { getNutrition } from '@/services/nutrition'
import { getInjuries } from '@/services/injuries'
import { getAttendance } from '@/services/attendance'
import { useMemo, useState } from 'react'

export default function AthleteProfile(){
  const { id } = useParams()
  const { data: athletes } = useQuery({ queryKey: ['athletes'], queryFn: ()=> getAthletes({}) })
  const athlete = athletes?.items.find(a=>a.id===id)
  const { data: nutrition } = useQuery({ queryKey: ['nutrition', id], queryFn: ()=> getNutrition({ athleteId: id }), enabled: !!id })
  const { data: injuries } = useQuery({ queryKey: ['injuries'], queryFn: ()=> getInjuries({}) })
  const { data: attendance } = useQuery({ queryKey: ['attendance'], queryFn: ()=> getAttendance({}) })

  const lastWeight = useMemo(()=> nutrition?.items?.slice(-1)[0]?.weightKg ?? '—', [nutrition])
  const [tab, setTab] = useState<'common'|'events'|'health'|'food'>('common')

  if (!athlete) return <div className="text-gray-500">Спортсмен не найден</div>

  const athleteInjuries = injuries?.items.filter(i=>i.athleteId===athlete.id) || []
  const missed = (attendance?.items||[]).filter(a=> a.status==='Отсутствовал').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{athlete.fullName}</div>
          <div className="text-gray-600 text-sm">Год рождения: {athlete.birthDate?.slice(0,4) || '—'}</div>
        </div>
        <div className="text-sm text-gray-600">Группа: {athlete.group}</div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex gap-3 border-b pb-2 mb-3">
          <button onClick={()=>setTab('common')} className={`px-3 py-1 rounded-2xl ${tab==='common'?'bg-accent text-white':'border'}`}>Общее</button>
          <button onClick={()=>setTab('events')} className={`px-3 py-1 rounded-2xl ${tab==='events'?'bg-accent text-white':'border'}`}>События</button>
          <button onClick={()=>setTab('health')} className={`px-3 py-1 rounded-2xl ${tab==='health'?'bg-accent text-white':'border'}`}>Здоровье</button>
          <button onClick={()=>setTab('food')} className={`px-3 py-1 rounded-2xl ${tab==='food'?'bg-accent text-white':'border'}`}>Питание</button>
        </div>

        {tab==='common' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div><b>Вес:</b> {lastWeight} кг</div>
              <div><b>Уровень подготовки:</b> —</div>
              <div><b>Сильные стороны:</b> —</div>
              <div><b>Слабые стороны:</b> —</div>
            </div>
            <div className="space-y-2">
              <div><b>Пропуски тренировок:</b> {missed}</div>
              <div><b>Активные травмы:</b> {athleteInjuries.filter(i=>i.status==='Активная').length}</div>
            </div>
          </div>
        )}

        {tab==='events' && (
          <div className="space-y-2">
            <div className="font-semibold">Повреждения</div>
            {athleteInjuries.length? athleteInjuries.map(i=>(
              <div key={i.id} className="text-sm border-b py-1">[{i.status}] {i.kind} — {i.date}</div>
            )): <div className="text-gray-500 text-sm">Нет данных</div>}
            <div className="font-semibold mt-3">Пропуски</div>
            <div className="text-sm text-gray-600">Всего пропусков: {missed}</div>
          </div>
        )}

        {tab==='health' && (
          <div className="grid grid-cols-2 gap-4">
            <div><b>Группа крови:</b> —</div>
            <div><b>Аллергии:</b> —</div>
            <div><b>Врожденные болезни:</b> —</div>
          </div>
        )}

        {tab==='food' && (
          <div className="space-y-2 text-sm">
            <div>Последний вес: <b>{lastWeight} кг</b></div>
            <div>Статус питания: —</div>
            <div>Потребление: —</div>
          </div>
        )}
      </div>
    </div>
  )
}

