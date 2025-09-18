
import { useState, useEffect } from 'react'
import { t } from '@/i18n/ru'

type Props = { onChange: (value: string)=>void }
export function TopbarSearch({ onChange }: Props){
  const [v, setV] = useState('')
  useEffect(()=>{
    const id = setTimeout(()=> onChange(v), 300)
    return ()=> clearTimeout(id)
  }, [v])
  return (
    <div className="w-full">
      <input
        aria-label={t('common.search')}
        placeholder={t('common.search')}
        value={v}
        onChange={e=>setV(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus-ring"
      />
    </div>
  )
}
