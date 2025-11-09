// src/main.tsx — точка входа фронтенда тренера

import React from 'react'                                        // React — библиотека для UI
import ReactDOM from 'react-dom/client'                          // ReactDOM — рендер в DOM
import {
  createBrowserRouter,                                           // createBrowserRouter — новый API роутинга
  RouterProvider,                                                // RouterProvider — провайдер роутера
  Navigate,                                                      // Navigate — программный редирект
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // QueryClient — клиент для React Query
import App from './App'                                          // App — корневой layout с навигацией
import './styles/tailwind.css'                                  // tailwind.css — глобальные стили

// провайдеры
import { AuthProvider } from '@/context/auth'                    // AuthProvider — контекст авторизации
import { ToastProvider } from '@/components/Toast'               // ToastProvider — всплывающие уведомления

// ленивые страницы основного приложения (защищённые роуты для тренера)
const TrainerProfile = React.lazy(() => import('./routes/TrainerProfile'))
const Dashboard      = React.lazy(() => import('./routes/Dashboard'))       // Dashboard — главная панель
const Athletes       = React.lazy(() => import('./routes/Athletes'))        // Athletes — список спортсменов
const AthleteProfile = React.lazy(() => import('./routes/AthleteProfile'))  // AthleteProfile — профиль спортсмена
const WeeklyPlan     = React.lazy(() => import('./routes/WeeklyPlan'))      // WeeklyPlan — недельный план
const Attendance     = React.lazy(() => import('./routes/Attendance'))      // Attendance — посещаемость
const Injuries       = React.lazy(() => import('./routes/Injuries'))        // Injuries — травмы
const InjuriesDetail = React.lazy(() => import('./routes/InjuriesDetail'))  // InjuriesDetail — детали травмы
const Nutrition      = React.lazy(() => import('./routes/Nutrition'))       // Nutrition — питание
const Reports        = React.lazy(() => import('./routes/Reports'))         // Reports — отчёты

// страницы логина/регистрации (открытые роуты)
const LoginPage    = React.lazy(() => import('./routes/LoginPage'))         // LoginPage — вход тренера
const RegisterPage = React.lazy(() => import('./routes/RegisterPage'))      // RegisterPage — регистрация тренера

// маршруты ошибок
import ErrorPage from './routes/ErrorPage'                                  // ErrorPage — общая ошибка роутера
import NotFound from './routes/NotFound'                                    // NotFound — 404

// защищающий компонент
import PrivateRoute from './routes/PrivateRoute'                            // PrivateRoute — пускает только с токеном

// ---------- Роутер приложения ----------

// router — единая конфигурация всех маршрутов
const router = createBrowserRouter([
  // ОТКРЫТЫЕ МАРШРУТЫ: логин и регистрация
  {
    path: '/login',                                                         // /login — страница входа
    element: (
      <React.Suspense fallback={<div>Загрузка…</div>}>                      {/* Suspense — ленивая загрузка */}
        <LoginPage />
      </React.Suspense>
    ),
    errorElement: <ErrorPage />,                                            // ErrorPage — при ошибке рендера
  },
  {
    path: '/register',                                                      // /register — регистрация тренера
    element: (
      <React.Suspense fallback={<div>Загрузка…</div>}>
        <RegisterPage />
      </React.Suspense>
    ),
    errorElement: <ErrorPage />,
  },

  // ЗАЩИЩЁННЫЙ БЛОК: всё приложение тренера — только после авторизации
  {
    path: '/',                                                              // базовый путь
    element: <PrivateRoute />,                                              // PrivateRoute — проверяет токен и даёт Outlet
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',                                                          // внутри PrivateRoute рендерим App
        element: <App />,                                                   // App — layout с хедером/меню и <Outlet/>
        children: [
          {                                                                 // редирект с корня на /dashboard
            index: true,                                                    // index — маршрут по умолчанию
            element: <Navigate to="/dashboard" replace />,                  // Navigate — перенаправление
          },
          {
            path: 'dashboard',                                              // /dashboard — главная панель
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <Dashboard />
              </React.Suspense>
            ),
          },
          {
            path: 'athletes',                                               // /athletes — список спортсменов
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <Athletes />
              </React.Suspense>
            ),
          },
          {
            path: 'athletes/:id',                                           // /athletes/:id — профиль спортсмена
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <AthleteProfile />
              </React.Suspense>
            ),
          },
          {
            path: 'weekly-plan',                                            // /weekly-plan — недельный план
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <WeeklyPlan />
              </React.Suspense>
            ),
          },
          {
            path: 'attendance',                                             // /attendance — посещаемость
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <Attendance />
              </React.Suspense>
            ),
          },
          {
            path: 'injuries',                                               // /injuries — список травм
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <Injuries />
              </React.Suspense>
            ),
          },
          {
            path: 'injuries/:id',                                           // /injuries/:id — детали травмы
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <InjuriesDetail />
              </React.Suspense>
            ),
          },
          {
            path: 'nutrition',                                              // /nutrition — питание
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <Nutrition />
              </React.Suspense>
            ),
          },
          {
            path: 'reports',                                                // /reports — отчёты
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <Reports />
              </React.Suspense>
            ),
          },
          {
            path: 'trainer-profile',
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <TrainerProfile />
              </React.Suspense>
            ),
          },
          // 404 внутри приложения тренера
          {
            path: '*',                                                      // любой неизвестный путь внутри App
            element: <NotFound />,                                          // NotFound — страница “Не найдено”
          },
        ],
      },
    ],
  },
])

// ---------- Инициализация React Query ----------

const qc = new QueryClient()                                               // qc — экземпляр клиента React Query

// ---------- Рендер приложения ----------

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>                                                       {/* StrictMode — доп. проверки в dev */}
    <QueryClientProvider client={qc}>                                      {/* QueryClientProvider — кэш запросов */}
      <AuthProvider>                                                       {/* AuthProvider — контекст авторизации */}
        <ToastProvider>                                                    {/* ToastProvider — уведомления/тосты */}
          <RouterProvider router={router} />                               {/* RouterProvider — подключаем роутер */}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
