
export function ConfirmDialog({ open, text, onConfirm, onCancel }:{
  open: boolean, text: string, onConfirm: ()=>void, onCancel: ()=>void
}){
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl shadow p-4 w-full max-w-md">
        <p className="mb-4">{text}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded-2xl border hover:bg-gray-50">Отмена</button>
          <button onClick={onConfirm} className="px-3 py-2 rounded-2xl bg-accent text-white">Ок</button>
        </div>
      </div>
    </div>
  )
}
