
import { ReactNode } from 'react'
export function Badge({ children, color='gray'}: { children: ReactNode, color?: 'gray'|'red'|'green'|'blue' }){
  const colorMap: Record<string,string> = {
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
  }
  return <span className={`px-2 py-1 rounded-2xl text-xs ${colorMap[color]}`}>{children}</span>
}
