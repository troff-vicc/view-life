import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './DashboardPage.css'

function TaskItem({ task, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [steps, setSteps] = useState([])
  const [loadedSteps, setLoadedSteps] = useState(false)

  const toggleExpand = async () => {
    if (!expanded && !loadedSteps) {
      const res = await api.get(`/tasks/${task.id}/steps/`)
      setSteps(res.data)
      setLoadedSteps(true)
    }
    setExpanded(!expanded)
  }

  const toggleStep = async (step) => {
    const res = await api.patch(`/tasks/steps/${step.id}/toggle/`)
    setSteps(steps.map(s => s.id === step.id ? { ...s, is_done: res.data.is_done } : s))
  }

  return (
    <div className="task-card">
      <button
        className={`checkbox ${task.status === 'done' ? 'checked' : ''}`}
        onClick={() => onToggle(task)}
      />
      <span className={`task-title ${task.status === 'done' ? 'done' : ''}`}>
        {task.title}
      </span>
      <button className="expand-btn" onClick={toggleExpand}>
        {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div className="steps-list">
          {steps.length === 0 && <span className="no-steps">Нет подзадач</span>}
          {steps.map(step => (
            <div key={step.id} className="step-item">
              <button
                className={`checkbox small ${step.is_done ? 'checked' : ''}`}
                onClick={() => toggleStep(step)}
              />
              <span className={step.is_done ? 'done' : ''}>{step.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/tasks/').then(res => setTasks(res.data))
  }, [])

  const toggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    const res = await api.patch(`/tasks/${task.id}/status/`, { status: newStatus })
    setTasks(tasks.map(t => t.id === task.id ? res.data : t))
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const doneTasks = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length ? (doneTasks / tasks.length) * 100 : 0

  return (
    <div className="dashboard">
      <div className="header">
        <button className="menu-btn">☰</button>
        <div className="header-right">
          <button className="icon-btn">🔔</button>
          <div className="avatar" onClick={logout} title="Выйти" />
        </div>
      </div>

      <div className="progress-card">
        <div className="progress-card-left">
          <h2>Задачи на сегодня:</h2>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{doneTasks}/{tasks.length} выполнено</span>
        </div>
        <div className="mascot">
          <img src="/mascot.png" alt="mascot" onError={e => e.target.style.display='none'} />
        </div>
      </div>

      <div className="task-list">
        {tasks.length === 0 && <p className="empty">Задач пока нет</p>}
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleTask} />
        ))}
      </div>

      <button className="fab" onClick={() => navigate('/ai')}>+</button>
    </div>
  )
}