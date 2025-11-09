import { useState } from 'react'
import { createReport } from '@/services/reports'
import { t } from '@/i18n/ru'

export default function Reports() {
  const [type, setType] = useState<'nutrition' | 'attendance' | 'weight'>(
    'attendance'
  )
  const [downloading, setDownloading] = useState(false)

  async function generate(kind: 'pdf' | 'csv') {
    setDownloading(true)
    try {
      const { url } = await createReport({ type, params: { kind } })
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${type}.${kind === 'csv' ? 'csv' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-6 space-y-4 text-[var(--color-text)]">
      <div className="flex items-center gap-3">
        <label className="text-sm text-[var(--color-muted)]">
          Тип отчёта
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="px-3 py-2 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-primary)]"
        >
          <option value="attendance">Посещаемость</option>
          <option value="nutrition">Питание</option>
          <option value="weight">Вес</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button
          disabled={downloading}
          onClick={() => generate('pdf')}
          className="btn-outline rounded-2xl text-sm px-4 py-2 disabled:opacity-50"
        >
          {t('actions.exportPDF')}
        </button>
        <button
          disabled={downloading}
          onClick={() => generate('csv')}
          className="btn-outline rounded-2xl text-sm px-4 py-2 disabled:opacity-50"
        >
          {t('actions.exportCSV')}
        </button>
      </div>
    </div>
  )
}
