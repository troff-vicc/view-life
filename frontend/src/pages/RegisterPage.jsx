import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import './AuthPage.css'

const ROLES = [
  { value: 'student', label: 'Ученик' },
  { value: 'teacher', label: 'Учитель' },
  { value: 'parent',  label: 'Родитель' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/users/register/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      window.location.href = '/dashboard'
    } catch {
      setError('Ошибка регистрации. Проверь данные.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-mascot-wrap">
        <img src="/mascot1.png" alt="" className="auth-mascot"
          onError={e => e.target.style.display='none'} />
      </div>
      <div className="auth-card">
        <h1 className="auth-title">Создание аккаунта</h1>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Логин</label>
            <input
              placeholder="Придумай логин"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Придумай пароль"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <div className="auth-roles-label">Кто ты?</div>
            <div className="auth-roles">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`auth-role-btn${form.role === r.value ? ' active' : ''}`}
                  onClick={() => setForm({...form, role: r.value})}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="auth-link">
          уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}
