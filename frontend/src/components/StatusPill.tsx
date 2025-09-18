
export function StatusPill({ status }: { status: string }){
  const map: Record<string,string> = {
    'Активная': 'bg-red-100 text-red-700',
    'Закрыта': 'bg-green-100 text-green-700',
    'Присутствовал': 'bg-green-100 text-green-700',
    'Опоздал': 'bg-yellow-100 text-yellow-800',
    'Отсутствовал': 'bg-red-100 text-red-700',
    'ОК': 'bg-green-100 text-green-700',
    'Требует внимания': 'bg-yellow-100 text-yellow-800',
  }
  return <span className={`px-2 py-1 rounded-2xl text-xs ${map[status]||'bg-gray-100 text-gray-700'}`}>{status}</span>
}
