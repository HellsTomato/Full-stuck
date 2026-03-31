import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'

import { getAthletes } from '@/services/athletes'
import { getWeeklyRation } from '@/services/ration'
import { getInjuries } from '@/services/injuries'
import { getAttendance } from '@/services/attendance'
import { formatTrainingGroup } from '@/utils/groupLabels'

export default function AthleteProfile() {
  // id берём из роут-параметров (/athletes/:id)
  const { id } = useParams<{ id: string }>()

  // список спортсменов
  const { data: athletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => getAthletes({}),
  })

  const athlete = athletes?.items.find((a) => a.id === id)

  // недельный рацион для текущей недели
  const { data: weekly } = useQuery({
    queryKey: ['ration', id],
    queryFn: () =>
      getWeeklyRation({
        athleteId: id!, // UUID строки, бэкенд так и ждёт
        week: new Date().toISOString().slice(0, 10), // сегодняшняя дата как точка недели
      }),
    enabled: !!id,
  })

  // травмы
  const { data: injuries } = useQuery({
    queryKey: ['injuries'],
    queryFn: () => getInjuries({}),
  })

  // посещаемость
  const { data: attendance } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => getAttendance({}),
  })

  // Последний известный вес из weekly.days[*].weight
  const lastWeight = useMemo(() => {
    if (!weekly) return '—'
    const days = weekly.days || []
    const lastDayWithWeight = [...days].reverse().find((d) => d.weight != null)
    return lastDayWithWeight?.weight ?? '—'
  }, [weekly])

  const [tab, setTab] = useState<'common' | 'events' | 'health' | 'food'>('common')

  // --- SEO: динамические мета-теги и JSON-LD для страницы профиля ---
  useEffect(() => {
    if (!athlete) return

    // Title — видно в SERP и вкладке браузера
    const title = `${athlete.fullName} — профиль спортсмена`
    document.title = title

    // Описание для поисковых систем
    setMeta('description', `Профиль ${athlete.fullName}, группа ${athlete.group || '—'}.`)

    // Open Graph для предпросмотра в соцсетях
    setMeta('og:title', title, 'property')
    setMeta('og:description', `Профиль спортсмена ${athlete.fullName}` , 'property')

    // canonical — текущий URL, чтобы исключить дубли
    setCanonical(window.location.href)

    // JSON-LD (минимальная разметка Person)
    const ld = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": athlete.fullName,
      "birthDate": athlete.birthDate || undefined,
      "url": window.location.href
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(ld)
    script.setAttribute('data-generated-by', 'LR4-SEO')
    document.head.appendChild(script)

    // Убираем добавленные теги при размонтировании/смене спортсмена
    return () => {
      removeMeta('description')
      removeMeta('og:title', 'property')
      removeMeta('og:description', 'property')
      removeCanonical()
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [athlete])

  // Вспомогательные функции для работы с head (минимальная реализация без сторонних библиотек)
  function setMeta(name: string, content: string | undefined, attr = 'name') {
    if (!content) return
    let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attr, name)
      document.head.appendChild(el)
    }
    el.content = content
  }

  function removeMeta(name: string, attr = 'name') {
    const el = document.head.querySelector(`meta[${attr}="${name}"]`)
    if (el && el.parentNode) el.parentNode.removeChild(el)
  }

  function setCanonical(href: string) {
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = href
  }

  function removeCanonical() {
    const link = document.head.querySelector('link[rel="canonical"]')
    if (link && link.parentNode) link.parentNode.removeChild(link)
  }
  // --- /SEO ---

  // --- External API widget: погода (пример интеграции внешнего API через backend adapter)
  const [weather, setWeather] = useState<{ location?: string; tempC?: number; description?: string } | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  useEffect(() => {
    // Пример: делаем запрос к нашему бэкенду, который адаптирует внешний API.
    // Используем дефолтные координаты (Москва) — это упрощение для ЛР.
    setWeatherLoading(true)
    setWeatherError(null)
    fetch('/api/external/weather?lat=55.7558&lon=37.6173')
      .then((r) => {
        if (!r.ok) throw new Error('service unavailable')
        return r.json()
      })
      .then((json) => {
        setWeather({ location: json.location, tempC: json.tempC, description: json.description })
      })
      .catch(() => {
        // Graceful degradation: показываем простое сообщение, не ломая страницу
        setWeatherError('Внешний сервис недоступен')
      })
      .finally(() => setWeatherLoading(false))
  }, [])
  // --- /External API widget ---

  if (!athlete) {
    return <div className="text-gray-500">Спортсмен не найден</div>
  }

  const athleteInjuries =
    injuries?.items.filter((i) => i.athleteId === athlete.id) || []

  const missed =
    (attendance?.items || []).filter((a) => a.status === 'Отсутствовал').length

  return (
    <div className="space-y-4">
      {/* Шапка с ФИО и группой */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{athlete.fullName}</div>
          <div className="text-gray-600 text-sm">
            Год рождения: {athlete.birthDate?.slice(0, 4) || '—'}
          </div>
        </div>
        <div className="text-sm text-gray-600">Группа: {formatTrainingGroup(athlete.group)}</div>
      </div>
      {/* Небольшой виджет погоды (интеграция внешнего API через backend-adapter) */}
      <div className="text-sm text-gray-700"> 
        {weatherLoading ? (
          <div>Загрузка погоды…</div>
        ) : weatherError ? (
          <div className="text-gray-500">{weatherError}</div>
        ) : weather ? (
          <div className="flex items-center gap-3">
            <div className="font-medium">Погода: </div>
            <div>{weather.location} — {weather.tempC ?? '—'}°C</div>
            <div className="text-gray-500">{weather.description}</div>
          </div>
        ) : (
          <div className="text-gray-500">Погода недоступна</div>
        )}
      </div>

      {/* Карточка с табами */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div className="flex gap-3 border-b pb-2 mb-3">
          <button
            onClick={() => setTab('common')}
            className={`px-3 py-1 rounded-2xl ${
              tab === 'common' ? 'bg-accent text-white' : 'border'
            }`}
          >
            Общее
          </button>
          <button
            onClick={() => setTab('events')}
            className={`px-3 py-1 rounded-2xl ${
              tab === 'events' ? 'bg-accent text-white' : 'border'
            }`}
          >
            События
          </button>
          <button
            onClick={() => setTab('health')}
            className={`px-3 py-1 rounded-2xl ${
              tab === 'health' ? 'bg-accent text-white' : 'border'
            }`}
          >
            Здоровье
          </button>
          <button
            onClick={() => setTab('food')}
            className={`px-3 py-1 rounded-2xl ${
              tab === 'food' ? 'bg-accent text-white' : 'border'
            }`}
          >
            Питание
          </button>
        </div>

        {tab === 'common' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <b>Вес:</b> {lastWeight} кг
              </div>
              <div>
                <b>Уровень подготовки:</b> —
              </div>
              <div>
                <b>Сильные стороны:</b> —
              </div>
              <div>
                <b>Слабые стороны:</b> —
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <b>Пропуски тренировок:</b> {missed}
              </div>
              <div>
                <b>Активные травмы:</b>{' '}
                {athleteInjuries.filter((i) => i.status === 'Активная').length}
              </div>
            </div>
          </div>
        )}

        {tab === 'events' && (
          <div className="space-y-2">
            <div className="font-semibold">Повреждения</div>
            {athleteInjuries.length ? (
              athleteInjuries.map((i) => (
                <div key={i.id} className="text-sm border-b py-1">
                  [{i.status}] {i.kind} — {i.date}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">Нет данных</div>
            )}

            <div className="font-semibold mt-3">Пропуски</div>
            <div className="text-sm text-gray-600">
              Всего пропусков: {missed}
            </div>
          </div>
        )}

        {tab === 'health' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <b>Группа крови:</b> —
            </div>
            <div>
              <b>Аллергии:</b> —
            </div>
            <div>
              <b>Врожденные болезни:</b> —
            </div>
          </div>
        )}

        {tab === 'food' && (
          <div className="space-y-2 text-sm">
            <div>
              Последний вес: <b>{lastWeight} кг</b>
            </div>
            <div>Статус питания: —</div>
            <div>Потребление: —</div>
          </div>
        )}
      </div>
    </div>
  )
}
