// src/routes/RegisterPage.tsx                    // страница регистрации тренера

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link — ссылка на /login
import { useAuth } from "@/context/auth";   // путь через alias "@"
import { registerAthlete, registerTrainer } from "../services/auth";   // registerTrainer — API регистрации
import { usePageSeo } from '@/utils/seo'

const RegisterPage: React.FC = () => {          // RegisterPage — компонент регистрации
  const [role, setRole] = useState<"TRAINER" | "ATHLETE">("TRAINER");
  const [username, setUsername] = useState(""); // username — логин
  const [password, setPassword] = useState(""); // password — пароль
  const [fullName, setFullName] = useState(""); // fullName — ФИО
  const [birthDate, setBirthDate] = useState("");
  const [group, setGroup] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null); // error — текст ошибки
  const [loading, setLoading] = useState(false); // loading — флаг загрузки

  const auth = useAuth();                        // auth — доступ к login/logout/token
  const navigate = useNavigate();                // navigate — переход по маршрутам

  usePageSeo({
    title: 'Регистрация в Sport Planner',
    description:
      'Создайте аккаунт тренера или спортсмена в Sport Planner и начните вести тренировочный процесс онлайн.',
    keywords: 'регистрация, спорт, тренер, спортсмен, личный кабинет',
  })

  const handleSubmit = async (e: React.FormEvent) => { // обработчик отправки формы
    e.preventDefault();                         // отменяем стандартный submit
    setError(null);                             // сбрасываем ошибку
    setLoading(true);                           // включаем "крутилку"

    try {
      const payload = role === "TRAINER"
        ? await registerTrainer(username, password, fullName)
        : await registerAthlete({
            username,
            password,
            fullName,
            birthDate,
            group,
            phone,
            notes,
          });
          auth.login(payload.accessToken, payload.refreshToken, payload.username, payload.role, payload.userId);
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
          Регистрация
        </h1>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-lg py-2 text-sm ${role === "TRAINER" ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-200"}`}
            onClick={() => setRole("TRAINER")}
          >
            Тренер
          </button>
          <button
            type="button"
            className={`rounded-lg py-2 text-sm ${role === "ATHLETE" ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-200"}`}
            onClick={() => setRole("ATHLETE")}
          >
            Атлет
          </button>
        </div>

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

          {role === "ATHLETE" && (
            <>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Дата рождения</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Группа</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
                  required
                >
                  <option value="">Выберите группу</option>
                  <option value="JUNIORS">Юниоры</option>
                  <option value="SENIORS">Старшие</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Телефон</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">Примечания</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 bg-slate-700 text-white outline-none"
                />
              </div>
            </>
          )}

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

        <p className="mt-2 text-xs text-slate-400 text-center">
          <Link to="/" className="hover:text-slate-200">О сервисе</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
