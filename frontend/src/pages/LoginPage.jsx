import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import './AuthPage.css'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/users/login/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      window.location.href = '/dashboard'
    } catch {
      setError('Неверный логин или пароль')
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
        <h1 className="auth-title">Вход</h1>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Логин</label>
            <input
              placeholder="Введи логин"
              value={form.username}
              onChange={e => setForm({...form, username: e.target.value})}
              autoComplete="username"
            />
          </div>
          <div className="auth-field">
            <label>Пароль</label>
            <input
              type="password"
              placeholder="Введи пароль"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className="auth-link">
          нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}
