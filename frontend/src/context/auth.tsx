import React, {                                     // React — библиотека UI
  createContext,                                    // createContext — создаёт контекст
  useContext,                                       // useContext — хук для чтения контекста
  useEffect,                                        // useEffect — хук побочных эффектов
  useState,                                         // useState — состояние компонента
  ReactNode,                                        // ReactNode — тип для детей
} from "react";

// AuthContextValue — тип значения контекста авторизации
type AuthContextValue = {
  token: string | null;                             // token — текущий JWT-токен или null
  username: string | null;                          // username — логин тренера
  role: "TRAINER" | "ATHLETE" | null;
  userId: string | null;
  login: (token: string, username: string, role: "TRAINER" | "ATHLETE", userId: string) => void; // login — функция входа
  logout: () => void;                               // logout — функция выхода
  loaded: boolean;                                  // loaded — флаг: авторизация уже загружена из localStorage
};

// создаём сам контекст; по умолчанию undefined, чтобы отлавливать неправильное использование
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Ключи для хранения данных в localStorage
const TOKEN_KEY = "auth_token";
const USERNAME_KEY = "auth_username";
const ROLE_KEY = "auth_role";
const USER_ID_KEY = "auth_user_id";

// AuthProviderProps — тип пропсов провайдера
type AuthProviderProps = {
  children: ReactNode;                              // children — всё приложение внутри провайдера
};

// AuthProvider — обёртка над приложением, даёт доступ к авторизации через контекст
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // token — токен авторизации; изначально null, пока не поднимем из localStorage
  const [token, setToken] = useState<string | null>(null);

  // username — имя пользователя (логин тренера)
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<"TRAINER" | "ATHLETE" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // loaded — флаг "мы уже проверили localStorage и знаем, авторизован юзер или нет"
  const [loaded, setLoaded] = useState(false);

  // useEffect — при первом монтировании провайдера читаем данные из localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);       // savedToken — токен из localStorage
    const savedUsername = localStorage.getItem(USERNAME_KEY); // savedUsername — логин из localStorage
    const savedRole = localStorage.getItem(ROLE_KEY) as "TRAINER" | "ATHLETE" | null;
    const savedUserId = localStorage.getItem(USER_ID_KEY);

    if (savedToken) {                                         // если токен был сохранён ранее
      setToken(savedToken);                                   // восстанавливаем токен в состояние
    }

    if (savedUsername) {                                      // если логин был сохранён ранее
      setUsername(savedUsername);                             // восстанавливаем логин в состояние
    }
    if (savedRole === "TRAINER" || savedRole === "ATHLETE") {
      setRole(savedRole);
    }
    if (savedUserId) {
      setUserId(savedUserId);
    }

    setLoaded(true);                                          // помечаем, что авторизация инициализирована
  }, []);                                                     // [] — выполняется один раз при монтировании

  // login — вызываем после успешного логина (получили токен и логин с бэка)
  const login = (newToken: string, user: string, newRole: "TRAINER" | "ATHLETE", newUserId: string) => {
    setToken(newToken);                                       // сохраняем токен в React-состояние
    setUsername(user);                                        // сохраняем логин в React-состояние
    setRole(newRole);
    setUserId(newUserId);

    localStorage.setItem(TOKEN_KEY, newToken);                // кладём токен в localStorage (персистентно)
    localStorage.setItem(USERNAME_KEY, user);                 // кладём логин в localStorage
    localStorage.setItem(ROLE_KEY, newRole);
    localStorage.setItem(USER_ID_KEY, newUserId);
  };

  // logout — вызываем при выходе из аккаунта
  const logout = () => {
    setToken(null);                                           // очищаем токен в состоянии
    setUsername(null);                                        // очищаем логин в состоянии
    setRole(null);
    setUserId(null);

    localStorage.removeItem(TOKEN_KEY);                       // удаляем токен из localStorage
    localStorage.removeItem(USERNAME_KEY);                    // удаляем логин из localStorage
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
  };

  // value — объект, который будет доступен всем компонентам через useAuth()
  const value: AuthContextValue = {
    token,                                                    // текущий токен
    username,                                                 // текущий логин
    role,
    userId,
    login,                                                    // функция входа
    logout,                                                   // функция выхода
    loaded,                                                   // флаг: авторизация инициализирована
  };

  return (
    <AuthContext.Provider value={value}>                      {/* Provider — "раздаём" контекст вниз по дереву */}
      {children}                                              {/* children — всё приложение внутри */}
    </AuthContext.Provider>
  );
};

// useAuth — удобный хук для доступа к контексту авторизации
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);                        // ctx — значение контекста

  if (!ctx) {                                                 // если контекст не найден
    // значит, компонент пытаются использовать useAuth вне AuthProvider — это ошибка
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }

  return ctx;                                                 // возвращаем объект с token, username, login, logout, loaded
};
