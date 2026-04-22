import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/users/login/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      navigate('/dashboard')
    } catch {
      setError('Неверный логин или пароль')
    }
  }

  return (
    <div>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Логин"
          value={form.username}
          onChange={e => setForm({...form, username: e.target.value})}
        /><br/>
        <input
          type="password"
          placeholder="Пароль"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
        /><br/>
        {error && <p style={{color:'red'}}>{error}</p>}
        <button type="submit">Войти</button>
      </form>
      <p>Нет аккаунта? <Link to="/register">Регистрация</Link></p>
    </div>
  )
}