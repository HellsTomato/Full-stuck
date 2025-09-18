
import { ReactNode } from 'react'

export function FormDialog({ open, title, onClose, children }:{
  open: boolean, title: string, onClose: ()=>void, children: ReactNode
}){
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow p-4 w-full max-w-lg">
        <div className="text-lg font-semibold mb-2">{title}</div>
        <div>{children}</div>
        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-3 py-2 rounded-2xl border hover:bg-gray-50">Закрыть</button>
        </div>
      </div>
    </div>
  )
}
