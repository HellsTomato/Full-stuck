// Тип для формы ошибки от бэкенда
type ErrorShape = {
  message: string;  // message — человекочитаемое сообщение об ошибке
  code?: string;    // code — необязательный код ошибки
};

// Ключи в localStorage — те же, что и в auth.tsx
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USERNAME_KEY = "auth_username";
const ROLE_KEY = "auth_role";
const USER_ID_KEY = "auth_user_id";

type AuthResponseShape = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  role?: "TRAINER" | "ATHLETE";
  userId?: string;
};

type FetchOptions = {
  skipAuth?: boolean;
  // retryOn401 включает единоразовый повтор запроса после refresh access token
  retryOn401?: boolean;
};

function clearAuthStorage() {
  // Полная очистка auth-состояния при невалидной/истёкшей сессии
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

function saveAuthFromResponse(payload: AuthResponseShape) {
  const newAccessToken = payload.accessToken ?? payload.token;
  const newRefreshToken = payload.refreshToken;
  if (newAccessToken) {
    localStorage.setItem(TOKEN_KEY, newAccessToken);
  }
  if (newRefreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
  }
  if (payload.username) {
    localStorage.setItem(USERNAME_KEY, payload.username);
  }
  if (payload.role) {
    localStorage.setItem(ROLE_KEY, payload.role);
  }
  if (payload.userId) {
    localStorage.setItem(USER_ID_KEY, payload.userId);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  // Запрос нового access token по refresh token
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as AuthResponseShape;
  saveAuthFromResponse(data);
  return data.accessToken ?? data.token ?? null;
}

export async function apiFetch(input: RequestInfo, init?: RequestInit, options: FetchOptions = {}): Promise<Response> {
  const { skipAuth = false, retryOn401 = true } = options;

  const headers = new Headers(init?.headers ?? undefined);
  if (!skipAuth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const firstResponse = await fetch(input, {
    ...init,
    headers,
  });

  if (firstResponse.status !== 401 || skipAuth || !retryOn401) {
    return firstResponse;
  }

  // 401 => пробуем silent refresh и повторяем исходный запрос
  const newAccessToken = await refreshAccessToken();
  if (!newAccessToken) {
    clearAuthStorage();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return firstResponse;
  }

  const retryHeaders = new Headers(init?.headers ?? undefined);
  retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
  });
}

// Универсальная функция для запросов к API
export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const headers = new Headers(init?.headers ?? undefined);
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await apiFetch(input, {
    ...init,
    headers,
  });

  // 401 после retry = сессия реально недействительна
  if (res.status === 401) {
    clearAuthStorage();

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
