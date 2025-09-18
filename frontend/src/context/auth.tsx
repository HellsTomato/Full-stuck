import { createContext, useContext, useState, ReactNode } from 'react'

type User = { id: string; fullName: string; email: string }
type AuthContextType = {
  user: User | null
  login: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Провайдер авторизации. Оборачивает всё приложение.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(
    JSON.parse(localStorage.getItem('trainer_user') || 'null')
  )

  const login = (u: User) => {
    setUser(u)
    localStorage.setItem('trainer_user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('trainer_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Хук для доступа к пользователю и методам login/logout
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
