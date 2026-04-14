// src/main.tsx — точка входа фронтенда тренера

import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles/tailwind.css'

import { AuthProvider } from '@/context/auth'
import { ToastProvider } from '@/components/Toast'

// ленивые страницы
const TrainerProfile = React.lazy(() => import('./routes/TrainerProfile'))
const AthleteSelfProfile = React.lazy(() => import('./routes/AthleteSelfProfile'))
const Dashboard = React.lazy(() => import('./routes/Dashboard'))
const Athletes = React.lazy(() => import('./routes/Athletes'))
const AthleteProfile = React.lazy(() => import('./routes/AthleteProfile'))
const WeeklyPlan = React.lazy(() => import('./routes/WeeklyPlan'))
const Attendance = React.lazy(() => import('./routes/Attendance'))
const Injuries = React.lazy(() => import('./routes/Injuries'))
const InjuriesDetail = React.lazy(() => import('./routes/InjuriesDetail'))
const RationPage = React.lazy(() => import('./routes/RationPage'))
const AthleteRationPage = React.lazy(() => import('./routes/AthleteRationPage'))
const Reports = React.lazy(() => import('./routes/Reports'))
const LandingPage = React.lazy(() => import('./routes/LandingPage'))

const LoginPage = React.lazy(() => import('./routes/LoginPage'))
const RegisterPage = React.lazy(() => import('./routes/RegisterPage'))

import ErrorPage from './routes/ErrorPage'
import NotFound from './routes/NotFound'
import PrivateRoute from './routes/PrivateRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <React.Suspense fallback={<div>Загрузка…</div>}>
        <LandingPage />
      </React.Suspense>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: (
      <React.Suspense fallback={<div>Загрузка…</div>}>
        <LoginPage />
      </React.Suspense>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/register',
    element: (
      <React.Suspense fallback={<div>Загрузка…</div>}>
        <RegisterPage />
      </React.Suspense>
    ),
    errorElement: <ErrorPage />,
  },
  {
    // Базовая защита: все дочерние экраны доступны только после логина
    element: <PrivateRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <App />,
        children: [
          {
            path: '/dashboard',
            element: (
              <React.Suspense fallback={<div>Загрузка…</div>}>
                <Dashboard />
              </React.Suspense>
            ),
          },
          {
            path: '/athletes',
            // trainer-only разделы проверяются через allowedRoles
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <Athletes />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/athletes/:id',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <AthleteProfile />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/weekly-plan',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <WeeklyPlan />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/attendance',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <Attendance />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/injuries',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <Injuries />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/injuries/:id',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <InjuriesDetail />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/ration',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <RationPage />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/ration/athlete/:athleteId',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <AthleteRationPage />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/reports',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <Reports />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/athlete-profile',
            // self-профиль доступен только роли ATHLETE
            element: <PrivateRoute allowedRoles={["ATHLETE"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <AthleteSelfProfile />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/trainer-profile',
            element: <PrivateRoute allowedRoles={["TRAINER"]} />,
            children: [
              {
                index: true,
                element: (
                  <React.Suspense fallback={<div>Загрузка…</div>}>
                    <TrainerProfile />
                  </React.Suspense>
                ),
              },
            ],
          },
          {
            path: '/app',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '*',
            element: <NotFound />,
          },
        ],
      },
    ],
  },
])

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
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
