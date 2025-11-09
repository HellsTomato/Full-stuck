import React, {                                     // React — библиотека UI
  createContext,                                    // createContext — создаёт контекст
  useContext,                                       // useContext — хук для чтения контекста
  useEffect,                                        // useEffect — хук побочных эффектов
  useState,                                         // useState — состояние компонента
  ReactNode,                                        // ReactNode — тип для детей
} from "react";

type AuthContextValue = {                           // AuthContextValue — тип значения контекста
  token: string | null;                             // token — текущий токен или null
  username: string | null;                          // username — логин тренера
  login: (token: string, username: string) => void; // login — функция входа
  logout: () => void;                               // logout — функция выхода
};

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined                                         // undefined — по умолчанию (не инициализирован)
);                                                  // создаём сам контекст

// LOCAL_STORAGE_KEY — ключ для хранения токена в браузере
const TOKEN_KEY = "trainer_token";                  // TOKEN_KEY — ключ токена
const USERNAME_KEY = "trainer_username";            // USERNAME_KEY — ключ логина

type AuthProviderProps = {                          // AuthProviderProps — тип пропсов
  children: ReactNode;                              // children — вложенные компоненты
};

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,                                         // children — всё приложение
}) => {
  const [token, setToken] = useState<string | null>(null);     // token — состояние токена
  const [username, setUsername] = useState<string | null>(null); // username — состояние логина

  useEffect(() => {                                 // useEffect — выполняется при монтировании
    const savedToken = localStorage.getItem(TOKEN_KEY);    // savedToken — токен из localStorage
    const savedUsername = localStorage.getItem(USERNAME_KEY); // savedUsername — логин из localStorage

    if (savedToken) {                               // если токен был сохранён
      setToken(savedToken);                         // восстанавливаем токен в состояние
    }
    if (savedUsername) {                            // если логин был сохранён
      setUsername(savedUsername);                   // восстанавливаем логин
    }
  }, []);                                           // [] — запуск один раз при монтировании

  const login = (newToken: string, user: string) => { // login — вызываем после успешного логина
    setToken(newToken);                             // сохраняем токен в состояние
    setUsername(user);                              // сохраняем логин в состояние
    localStorage.setItem(TOKEN_KEY, newToken);      // пишем токен в localStorage
    localStorage.setItem(USERNAME_KEY, user);       // пишем логин в localStorage
  };

  const logout = () => {                            // logout — очищаем авторизацию
    setToken(null);                                 // убираем токен из state
    setUsername(null);                              // убираем логин из state
    localStorage.removeItem(TOKEN_KEY);             // удаляем токен из localStorage
    localStorage.removeItem(USERNAME_KEY);          // удаляем логин из localStorage
  };

  const value: AuthContextValue = {                 // value — объект, который увидят потребители
    token,                                          // token — текущее значение
    username,                                       // username — логин
    login,                                          // login — функция входа
    logout,                                         // logout — функция выхода
  };

  return (
    <AuthContext.Provider value={value}>            {/* Provider — отдаём значение контекста */}
      {children}                                    {/* children — само приложение */}
    </AuthContext.Provider>
  );
};

// useAuth — удобный хук для использования контекста
export const useAuth = (): AuthContextValue => {    // useAuth — хук
  const ctx = useContext(AuthContext);              // ctx — значение из контекста
  if (!ctx) {                                       // если контекст не найден
    throw new Error("useAuth должен использоваться внутри AuthProvider"); // защита от ошибок
  }
  return ctx;                                       // возвращаем значение контекста
};
