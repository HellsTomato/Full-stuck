// src/routes/RegisterPage.tsx                    // страница регистрации тренера

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link — ссылка на /login
import { useAuth } from "@/context/auth";   // путь через alias "@"
import { registerTrainer } from "../services/auth";   // registerTrainer — API регистрации

const RegisterPage: React.FC = () => {          // RegisterPage — компонент регистрации
  const [username, setUsername] = useState(""); // username — логин
  const [password, setPassword] = useState(""); // password — пароль
  const [fullName, setFullName] = useState(""); // fullName — ФИО
  const [error, setError] = useState<string | null>(null); // error — текст ошибки
  const [loading, setLoading] = useState(false); // loading — флаг загрузки

  const auth = useAuth();                        // auth — доступ к login/logout/token
  const navigate = useNavigate();                // navigate — переход по маршрутам

  const handleSubmit = async (e: React.FormEvent) => { // обработчик отправки формы
    e.preventDefault();                         // отменяем стандартный submit
    setError(null);                             // сбрасываем ошибку
    setLoading(true);                           // включаем "крутилку"

    try {
      const token = await registerTrainer(username, password, fullName); // регистрируем → токен
      auth.login(token, username);              // сразу логиним после регистрации
      navigate("/dashboard");                   // переносим в кабинет тренера
    } catch (err: any) {                        // перехватываем ошибку
      setError(err.message || "Ошибка при регистрации"); // показываем текст
    } finally {
      setLoading(false);                        // выключаем loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-white mb-6 text-center">
          Регистрация тренера
        </h1>

        {error && (
          <div className="mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              ФИО
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Логин
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2 mt-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium"
          >
            {loading ? "Регистрируем..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-300 text-center">
          Уже есть аккаунт?{" "}
          <Link
            to="/login"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
