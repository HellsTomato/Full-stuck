
import { useState } from 'react'
import { createReport } from '@/services/reports'
import { t } from '@/i18n/ru'

export default function Reports(){
  const [type, setType] = useState<'nutrition'|'attendance'|'weight'>('attendance')
  const [downloading, setDownloading] = useState(false)

  async function generate(kind: 'pdf'|'csv'){
    setDownloading(true)
    try {
      const { url } = await createReport({ type, params: { kind } })
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${type}.${kind==='csv'?'csv':'csv'}` // mock: both as CSV
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm">Тип отчёта</label>
        <select value={type} onChange={e=>setType(e.target.value as any)} className="px-3 py-2 border rounded-2xl">
          <option value="attendance">Посещаемость</option>
          <option value="nutrition">Питание</option>
          <option value="weight">Вес</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button disabled={downloading} onClick={()=>generate('pdf')} className="px-3 py-2 rounded-2xl border hover:bg-gray-50 disabled:opacity-50">{t('actions.exportPDF')}</button>
        <button disabled={downloading} onClick={()=>generate('csv')} className="px-3 py-2 rounded-2xl border hover:bg-gray-50 disabled:opacity-50">{t('actions.exportCSV')}</button>
      </div>
    </div>
  )
}
