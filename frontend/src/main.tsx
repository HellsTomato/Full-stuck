// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/tailwind.css'

// провайдеры (если у тебя их нет — закомментируй)
import { AuthProvider } from '@/context/auth'
import { ToastProvider } from '@/components/Toast'

// страницы (ленивая подгрузка)
const Dashboard      = React.lazy(() => import('./routes/Dashboard'))       // "Главное меню"
const Athletes       = React.lazy(() => import('./routes/Athletes'))
const AthleteProfile = React.lazy(() => import('./routes/AthleteProfile'))
const WeeklyPlan     = React.lazy(() => import('./routes/WeeklyPlan'))
const Attendance     = React.lazy(() => import('./routes/Attendance'))
const Injuries       = React.lazy(() => import('./routes/Injuries'))
const InjuriesDetail = React.lazy(() => import('./routes/InjuriesDetail'))   // если нет — удали строку и маршрут
const Nutrition      = React.lazy(() => import('./routes/Nutrition'))
const Reports        = React.lazy(() => import('./routes/Reports'))

// страница ошибок/404 (если создал по моей инструкции)
import ErrorPage from './routes/ErrorPage'
import NotFound from './routes/NotFound'

// ⚠️ ВАЖНО: router объявляем ОДИН раз
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />, // аккуратная страница ошибок вместо красного экрана
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',    element: <React.Suspense fallback={<div>Загрузка…</div>}><Dashboard/></React.Suspense> },
      { path: 'athletes',     element: <React.Suspense fallback={<div>Загрузка…</div>}><Athletes/></React.Suspense> },
      { path: 'athletes/:id', element: <React.Suspense fallback={<div>Загрузка…</div>}><AthleteProfile/></React.Suspense> },
      { path: 'weekly-plan',  element: <React.Suspense fallback={<div>Загрузка…</div>}><WeeklyPlan/></React.Suspense> },
      { path: 'attendance',   element: <React.Suspense fallback={<div>Загрузка…</div>}><Attendance/></React.Suspense> },
      { path: 'injuries',     element: <React.Suspense fallback={<div>Загрузка…</div>}><Injuries/></React.Suspense> },
      // убери этот маршрут, если нет файла InjuriesDetail.tsx
      { path: 'injuries/:id', element: <React.Suspense fallback={<div>Загрузка…</div>}><InjuriesDetail/></React.Suspense> },
      { path: 'nutrition',    element: <React.Suspense fallback={<div>Загрузка…</div>}><Nutrition/></React.Suspense> },
      { path: 'reports',      element: <React.Suspense fallback={<div>Загрузка…</div>}><Reports/></React.Suspense> },

      // 404
      { path: '*', element: <NotFound /> },
    ],
  },
])

// React Query
const qc = new QueryClient()

// 🚫 Если раньше включал MSW — не запускаем его здесь (чтобы ходить на реальный бэк)
// async function enableMSW() {
//   const { worker } = await import('./mocks/browser')
//   await worker.start({ onUnhandledRequest: 'bypass' })
// }
// enableMSW().then(() => { ...render... })

// Рендер
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)

