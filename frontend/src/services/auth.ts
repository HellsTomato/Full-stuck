// src/services/auth.ts
const BASE_URL = "/api";

// Вход (логин)
export async function loginTrainer(username: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/login`, {
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

  const data = await response.json();
  return data.token as string;
}

// Регистрация тренера
export async function registerTrainer(
  username: string,
  password: string,
  fullName: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/register`, {
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

  const data = await response.json();
  return data.token as string;
}
