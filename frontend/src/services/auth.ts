// src/services/auth.ts
const BASE_URL = "/api";

export type AuthRole = "TRAINER" | "ATHLETE";

export type AuthResponse = {
  token: string;
  username: string;
  role: AuthRole;
  userId: string;
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

  return (await response.json()) as AuthResponse;
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

  return (await response.json()) as AuthResponse;
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

  return (await response.json()) as AuthResponse;
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

  return (await response.json()) as AuthResponse;
}
