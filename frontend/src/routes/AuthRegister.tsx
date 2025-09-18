import { useState } from 'react'
import { t } from '@/i18n/ru'
import { useAuth } from '@/context/auth'

export default function AuthRegister(){
  const { login } = useAuth()
  const [fullName, setFullName] = useState('Иван Иванов')
  const [email, setEmail] = useState('coach@example.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent){
    e.preventDefault()
    try{
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ fullName, email, password }) })
      if (!res.ok) throw new Error('fail')
      const data = await res.json()
      login(data.user, data.token)
      location.href = '/dashboard'
    }catch{
      setError('Ошибка регистрации')
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded-2xl shadow w-full max-w-md space-y-4">
        <div className="text-xl font-semibold">{t('auth.titleRegister')}</div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="text-sm">{t('auth.fullName')}</label>
          <input className="w-full px-3 py-2 border rounded-2xl" value={fullName} onChange={e=>setFullName(e.target.value)}/>
        </div>
        <div>
          <label className="text-sm">{t('auth.email')}</label>
          <input className="w-full px-3 py-2 border rounded-2xl" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div>
          <label className="text-sm">{t('auth.password')}</label>
          <input type="password" className="w-full px-3 py-2 border rounded-2xl" value={password} onChange={e=>setPassword(e.target.value)}/>
        </div>
        <button className="w-full px-3 py-2 rounded-2xl bg-accent text-white">{t('auth.submitRegister')}</button>
        <div className="text-sm text-center">
          Уже есть аккаунт? <a className="text-accent underline" href="/auth/login">Вход</a>
        </div>
      </form>
    </div>
  )
}
