// Тип для формы ошибки от бэкенда
type ErrorShape = {
  message: string;  // message — человекочитаемое сообщение об ошибке
  code?: string;    // code — необязательный код ошибки
};

// Ключи в localStorage — те же, что и в auth.tsx
const TOKEN_KEY = "auth_token";
const USERNAME_KEY = "auth_username";
const ROLE_KEY = "auth_role";
const USER_ID_KEY = "auth_user_id";

// Универсальная функция для запросов к API
export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  // 1. Достаём токен из localStorage
  const token = localStorage.getItem(TOKEN_KEY); // token — сохранённый JWT или null

  // 2. Собираем заголовки запроса
  const headers: HeadersInit = {
    "Content-Type": "application/json",          // всегда JSON по умолчанию
    ...(init?.headers || {}),                   // поверх — любые кастомные заголовки,
  };                                            // которые передали из сервиса

  // 3. Если токен есть — добавляем Authorization
  if (token) {
    // Важно: если в init.headers уже передан Authorization —
    // наш токен его перезапишет (это нормально)
    (headers as any).Authorization = `Bearer ${token}`; // стандартный формат JWT
  }

  // 4. Делаем реальный запрос
  const res = await fetch(input, {
    ...init,      // остальные опции (method, body и т.п.)
    headers,      // наши заголовки с токеном
  });

  // 5. Обработка 401 — неавторизован
  if (res.status === 401) {
    // Если бэкенд сказал "не авторизован" — чистим хранилище
    localStorage.removeItem(TOKEN_KEY);       // убираем токен
    localStorage.removeItem(USERNAME_KEY);    // убираем логин
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);

    // Можно сразу отправить пользователя на страницу логина
    // (если зайдёт — оставь, если нет — закомментируй)
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";        // редирект на страницу логина
    }

    throw new Error("Не авторизован. Пожалуйста, войдите снова."); // пробрасываем понятную ошибку
  }

  // 5.1 Обработка 403 — прав недостаточно
  if (res.status === 403) {
    // UI может показать это сообщение в toast/alert
    throw new Error("Недостаточно прав для выполнения действия.");
  }

  // 6. Обработка остальных неуспешных статусов
  if (!res.ok) {
    let err: ErrorShape = { message: "Unknown error" }; // значение по умолчанию
    try {
      err = (await res.json()) as ErrorShape;           // пытаемся распарсить JSON-ошибку
    } catch {
      // если тело не JSON — игнорируем, оставляем дефолт
    }
    throw new Error(err.message || "Ошибка");           // кидаем Error с сообщением
  }

  // 7. Если всё хорошо — пытаемся прочитать JSON
  try {
    return (await res.json()) as T;                     // возвращаем распарсенный ответ
  } catch {
    // если тело пустое (204 No Content) — просто вернём undefined
    return undefined as unknown as T;                   // даём компилятору успокоиться
  }
}
