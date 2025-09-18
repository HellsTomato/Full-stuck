import React from 'react'

type Props = {
  name?: string
  src?: string
  size?: number // px
  className?: string
}

export default function Avatar({ name, src, size = 36, className = '' }: Props) {
  // безопасные инициалы
  const initials =
    (name?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('')) || '??'

  const dimension = { width: size, height: size, minWidth: size, minHeight: size }

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Аватар'}
        style={dimension}
        className={`rounded-full object-cover bg-gray-100 ${className}`}
        onError={(e) => {
          // если картинка не загрузилась — показываем заглушку
          (e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
    )
  }

  // плейсхолдер с инициалами
  return (
    <div
      aria-label={name || 'Аватар'}
      title={name || ''}
      style={dimension}
      className={`rounded-full flex items-center justify-center bg-gray-200 text-gray-700 text-sm font-medium ${className}`}
    >
      {initials}
    </div>
  )
}
