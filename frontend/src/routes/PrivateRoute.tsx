// src/routes/PrivateRoute.tsx                     // защищённый роут для тренера

import React from "react";
import { Navigate, Outlet } from "react-router-dom"; // Navigate — редирект, Outlet — вложенные роуты
import { useAuth } from "@/context/auth";            // useAuth — берём токен из контекста

const PrivateRoute: React.FC = () => {           // PrivateRoute — компонент-обёртка
  const { token } = useAuth();                   // token — текущий токен авторизации

  if (!token) {                                  // если токена нет
    return <Navigate to="/login" replace />;     // перебрасываем на страницу логина
  }

  return <Outlet />;                             // если токен есть — рендерим вложенные маршруты
};

export default PrivateRoute;                     // экспорт по умолчанию
