// src/routes/LoginPage.tsx                       // страница входа тренера

import React, { useState } from "react";         // useState — состояние полей формы
import { useNavigate, Link } from "react-router-dom"; // useNavigate/Link — навигация
import { useAuth } from "@/context/auth";   // путь через alias "@"
import { loginAthlete, loginTrainer } from "../services/auth";      // loginTrainer — запрос на бэкенд

const LoginPage: React.FC = () => {              // LoginPage — компонент страницы входа
  const [role, setRole] = useState<"TRAINER" | "ATHLETE">("TRAINER");
  const [username, setUsername] = useState("");  // username — поле логина
  const [password, setPassword] = useState("");  // password — поле пароля
  const [error, setError] = useState<string | null>(null); // error — текст ошибки
  const [loading, setLoading] = useState(false); // loading — флаг загрузки

  const auth = useAuth();                        // auth — объект контекста (token, login, logout)
  const navigate = useNavigate();                // navigate — функция перехода по маршрутам

  const handleSubmit = async (e: React.FormEvent) => { // handleSubmit — обработчик формы
    e.preventDefault();                         // preventDefault — не перезагружать страницу
    setError(null);                             // очищаем прошлую ошибку
    setLoading(true);                           // включаем индикатор загрузки

    try {
      const payload = role === "TRAINER"
        ? await loginTrainer(username, password)
        : await loginAthlete(username, password);

      auth.login(payload.accessToken, payload.refreshToken, payload.username, payload.role, payload.userId);
      navigate("/dashboard");                   // после успешного входа → на главную тренера
    } catch (err: any) {                        // перехват ошибки
      setError(err.message || "Ошибка при входе"); // показываем сообщение пользователю
    } finally {
      setLoading(false);                        // выключаем индикатор загрузки
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      {/* корневой контейнер: центрируем форму */}
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-lg">
        {/* карточка формы */}
        <h1 className="text-2xl font-semibold text-white mb-6 text-center">
          Вход
        </h1>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-lg py-2 text-sm ${role === "TRAINER" ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-200"}`}
            onClick={() => setRole("TRAINER")}
          >
            Я тренер
          </button>
          <button
            type="button"
            className={`rounded-lg py-2 text-sm ${role === "ATHLETE" ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-200"}`}
            onClick={() => setRole("ATHLETE")}
          >
            Я атлет
          </button>
        </div>

        {error && (                               // если есть ошибка — показываем блок
          <div className="mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* форма логина */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)} // обновляем state при вводе
              className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // обновляем state
              className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2 mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium"
          >
            {loading ? "Входим..." : "Войти"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300 text-center">
          Нет аккаунта?{" "}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Зарегистрироваться как {role === "TRAINER" ? "тренер" : "атлет"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;                        // экспорт по умолчанию
