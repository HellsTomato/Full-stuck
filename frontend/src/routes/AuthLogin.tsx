import { useState } from 'react'
import { t } from '@/i18n/ru'
import { useAuth } from '@/context/auth'

export default function AuthLogin(){
  const { login } = useAuth()
  const [email, setEmail] = useState('coach@example.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent){
    e.preventDefault()
    try{
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      login(data.user, data.token)
      location.href = '/dashboard'
    }catch{
      setError('Неверные данные')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded-2xl shadow w-full max-w-md space-y-4">
        <div className="text-xl font-semibold">{t('auth.titleLogin')}</div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="text-sm">{t('auth.email')}</label>
          <input className="w-full px-3 py-2 border rounded-2xl" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div>
          <label className="text-sm">{t('auth.password')}</label>
          <input type="password" className="w-full px-3 py-2 border rounded-2xl" value={password} onChange={e=>setPassword(e.target.value)}/>
        </div>
        <button className="w-full px-3 py-2 rounded-2xl bg-accent text-white">{t('auth.submitLogin')}</button>
        <div className="text-sm text-center">
          Нет аккаунта? <a className="text-accent underline" href="/auth/register">Регистрация</a>
        </div>
      </form>
    </div>
  )
}
