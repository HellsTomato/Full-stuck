import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/auth'
import { usePageSeo } from '@/utils/seo'

export default function LandingPage() {
  const { token, loaded } = useAuth()

  usePageSeo({
    title: 'Sport Planner - платформа для тренера и спортсмена',
    description:
      'Sport Planner помогает тренеру управлять спортсменами, посещаемостью, планами и отчётами, а атлету - видеть персональный прогресс.',
    keywords:
      'тренер, спортсмен, спортивный план, посещаемость, отчёты, спорт',
    image: '/og-image.svg',
  })

  if (loaded && token) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="text-lg font-semibold tracking-wide text-cyan-300">Sport Planner</div>
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Регистрация
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-10 md:grid-cols-2 md:py-14">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
              Платформа спортивной команды
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Управляйте тренировками, посещаемостью и прогрессом в одном месте
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
              Сервис для тренеров и атлетов: план недели, история посещений, травмы,
              рацион и наглядные отчёты без ручных таблиц.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Попробовать бесплатно
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
              >
                Уже есть аккаунт
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-900/20 backdrop-blur">
              <h2 className="text-lg font-semibold text-cyan-200">Для тренера</h2>
              <p className="mt-2 text-sm text-slate-300">
                Контролируйте группы, отмечайте посещаемость, следите за травмами и
                собирайте отчёты по динамике спортсменов.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-blue-900/20 backdrop-blur">
              <h2 className="text-lg font-semibold text-blue-200">Для спортсмена</h2>
              <p className="mt-2 text-sm text-slate-300">
                Видьте свой профиль, персональные планы, рацион и ключевые метрики
                прогресса в одном кабинете.
              </p>
            </article>
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-indigo-900/20 backdrop-blur">
              <h2 className="text-lg font-semibold text-indigo-200">Быстрый старт</h2>
              <p className="mt-2 text-sm text-slate-300">
                Регистрация занимает меньше минуты, после чего сразу доступны рабочие
                разделы без дополнительной настройки.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
