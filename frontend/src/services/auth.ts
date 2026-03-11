// src/services/auth.ts
const BASE_URL = "/api";

export type AuthRole = "TRAINER" | "ATHLETE";

export type AuthResponse = {
  token: string;
  accessToken: string;
  refreshToken: string;
  username: string;
  role: AuthRole;
  userId: string;
};

export type CurrentUserResponse = {
  userId: string;
  username: string;
  role: AuthRole;
};

export type RegisterAthletePayload = {
  username: string;
  password: string;
  fullName: string;
  birthDate: string;
  group: string;
  phone?: string;
  notes?: string;
};

function normalizeAuthResponse(raw: any): AuthResponse {
  // Поддерживаем и новый формат (accessToken), и legacy поле token.
  const accessToken = raw?.accessToken ?? raw?.token;
  if (!accessToken || !raw?.refreshToken) {
    throw new Error("Некорректный ответ сервера аутентификации");
  }

  return {
    token: accessToken,
    accessToken,
    refreshToken: raw.refreshToken,
    username: raw.username,
    role: raw.role,
    userId: raw.userId,
  };
}

// Вход (логин)
export async function loginTrainer(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/login/trainer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Неверный логин или пароль");
    }
    throw new Error("Ошибка при входе");
  }

  return normalizeAuthResponse(await response.json());
}

export async function loginAthlete(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/login/athlete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Неверный логин или пароль");
    }
    throw new Error("Ошибка при входе");
  }

  return normalizeAuthResponse(await response.json());
}

// Регистрация тренера
export async function registerTrainer(
  username: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/register/trainer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, fullName }),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Такой логин уже используется");
    }
    throw new Error("Ошибка при регистрации");
  }

  return normalizeAuthResponse(await response.json());
}

export async function registerAthlete(payload: RegisterAthletePayload): Promise<AuthResponse> {
  const response = await fetch(`${BASE_URL}/register/athlete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Такой логин уже используется");
    }
    throw new Error("Ошибка при регистрации");
  }

  return normalizeAuthResponse(await response.json());
}

export async function refreshSession(refreshToken: string): Promise<AuthResponse> {
  // Явный refresh endpoint (помимо автоматического в api client)
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Сессия истекла. Войдите снова.");
  }

  return normalizeAuthResponse(await response.json());
}

export async function logoutSession(refreshToken: string | null): Promise<void> {
  // Logout сообщает серверу, какой refresh нужно отозвать.
  await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getCurrentUser(accessToken: string): Promise<CurrentUserResponse> {
  // Технический endpoint для проверки текущей аутентификации.
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Не удалось получить текущего пользователя");
  }

  return (await response.json()) as CurrentUserResponse;
}
