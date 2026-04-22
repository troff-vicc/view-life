import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/users/register/', form)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      navigate('/dashboard')
    } catch (err) {
      setError('Ошибка регистрации')
    }
  }

  return (
    <div>
      <h2>Регистрация</h2>
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
        <select
          value={form.role}
          onChange={e => setForm({...form, role: e.target.value})}
        >
          <option value="student">Ученик</option>
          <option value="teacher">Учитель</option>
          <option value="parent">Родитель</option>
        </select><br/>
        {error && <p style={{color:'red'}}>{error}</p>}
        <button type="submit">Зарегистрироваться</button>
      </form>
      <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </div>
  )
}