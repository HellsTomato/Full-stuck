import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getInjuries } from '@/services/injuries'
import { getAthletes } from '@/services/athletes'
import { useState } from 'react'

export default function InjuriesDetail(){
  const { id } = useParams<{ id: string }>()
  const athleteId = id

  const { data: injuries } = useQuery({ queryKey: ['injuries'], queryFn: ()=> getInjuries({}) })
  const { data: athletes } = useQuery({ queryKey: ['athletes'], queryFn: ()=> getAthletes({}) })

  const athlete = athletes?.items.find(a=>a.id===athleteId)
  const active = injuries?.items.filter(i=>i.athleteId===athleteId && i.status==='Активная') || []
  const archive = injuries?.items.filter(i=>i.athleteId===athleteId && i.status!=='Активная') || []
  const [tab, setTab] = useState<'active'|'archive'|'stats'>('active')

  if (!athlete) return <div className="p-6 text-gray-500">Спортсмен не найден</div>

  return (
    <div className="p-6 space-y-4">
      <div className="text-2xl font-semibold">{athlete.fullName}</div>
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex gap-3 border-b pb-2 mb-3">
          <button onClick={()=>setTab('active')}  className={`px-3 py-1 rounded-2xl ${tab==='active' ? 'bg-accent text-white':'border'}`}>Активные травмы</button>
          <button onClick={()=>setTab('archive')} className={`px-3 py-1 rounded-2xl ${tab==='archive'? 'bg-accent text-white':'border'}`}>Архив</button>
          <button onClick={()=>setTab('stats')}   className={`px-3 py-1 rounded-2xl ${tab==='stats'  ? 'bg-accent text-white':'border'}`}>Статистика</button>
        </div>

        {tab==='active' && (
          <div className="space-y-2 text-sm">
            {active.length? active.map(i=>(
              <div key={i.id}>[{i.date}] {i.kind} — {i.recommendations||'—'}</div>
            )): <div className="text-gray-500">Нет активных травм</div>}
          </div>
        )}

        {tab==='archive' && (
          <div className="space-y-2 text-sm">
            {archive.length? archive.map(i=>(
              <div key={i.id}>[{i.date}] {i.kind}</div>
            )): <div className="text-gray-500">Архив пуст</div>}
          </div>
        )}

        {tab==='stats' && (
          <div className="text-sm text-gray-700">
            Всего травм: {(active.length + archive.length)}<br/>
            Активных: {active.length} / В архиве: {archive.length}
          </div>
        )}
      </div>
    </div>
  )
}
