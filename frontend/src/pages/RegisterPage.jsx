import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import './AuthPage.css'

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
      navigate('/dashboard')
    } catch {
      setError('Ошибка регистрации. Проверь данные.')
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    { value: 'student', label: '🎒 Ученик' },
    { value: 'teacher', label: '👨‍🏫 Учитель' },
    { value: 'parent', label: '👨‍👧 Родитель' },
  ]

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">📚</div>
        <h1 className="auth-title">Плани</h1>
        <p className="auth-subtitle">Создай аккаунт</p>

        <form onSubmit={handleSubmit} className="auth-form">
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
            <label>Кто ты?</label>
            <div className="auth-roles">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  className={`auth-role-btn ${form.role === r.value ? 'active' : ''}`}
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
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}