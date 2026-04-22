import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function DashboardPage() {
  const [tasks, setTasks] = useState([])
  const [form, setForm] = useState({ title: '', subject: '', priority: 'medium' })
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/tasks/').then(res => setTasks(res.data))
  }, [])

  const createTask = async (e) => {
    e.preventDefault()
    const res = await api.post('/tasks/create/', form)
    setTasks([res.data, ...tasks])
    setForm({ title: '', subject: '', priority: 'medium' })
  }

  const changeStatus = async (id, status) => {
    const res = await api.patch(`/tasks/${id}/status/`, { status })
    setTasks(tasks.map(t => t.id === id ? res.data : t))
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div>
      <h2>Мои задачи</h2>
      <button onClick={logout}>Выйти</button>

      <h3>Добавить задачу вручную</h3>
      <form onSubmit={createTask}>
        <input
          placeholder="Название"
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
          required
        /><br/>
        <input
          placeholder="Предмет"
          value={form.subject}
          onChange={e => setForm({...form, subject: e.target.value})}
        /><br/>
        <select
          value={form.priority}
          onChange={e => setForm({...form, priority: e.target.value})}
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select><br/>
        <button type="submit">Создать</button>
      </form>

      <h3>Список задач:</h3>
      {tasks.length === 0 && <p>Задач пока нет</p>}
      {tasks.map(task => (
        <div key={task.id} style={{border:'1px solid #ccc', margin:'8px', padding:'8px'}}>
          <b>{task.title}</b> | {task.subject} | {task.priority} | <b>{task.status}</b>
          <br/>
          <button onClick={() => changeStatus(task.id, 'in_progress')}>В процессе</button>
          <button onClick={() => changeStatus(task.id, 'done')}>Выполнено ✅</button>
        </div>
      ))}
    </div>
  )
}