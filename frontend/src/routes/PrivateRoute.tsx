import React from "react";
import { Navigate, Outlet } from "react-router-dom"; // Outlet — "вложенные" маршруты внутри защищённого роутa
import { useAuth } from "../context/auth";           // useAuth — наш контекст авторизации

const PrivateRoute: React.FC = () => {
  const { token, loaded } = useAuth();              // берём token и loaded из контекста

  // 1. Пока авторизация ещё загружается из localStorage — ничего не делаем
  //    Важно: мы НЕ редиректим на /login и НЕ рендерим контент,
  //    чтобы не было мигания и ложного выкидывания.
  if (!loaded) {
    return null;                                    // можно вернуть спиннер, но null — минимальный вариант
  }

  // 2. Когда loaded = true, значит мы уже знаем точно, есть токен или нет.
  //    Если токена нет — пользователь не авторизован → отправляем на /login.
  if (!token) {
    return <Navigate to="/login" replace />;        // replace — чтобы не засорять историю
  }

  // 3. Если токен есть — рендерим вложенные роуты (Dashboard, Athletes, WeeklyPlan и т.п.)
  return <Outlet />;
};

export default PrivateRoute;
