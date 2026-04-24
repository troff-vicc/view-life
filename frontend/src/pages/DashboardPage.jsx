import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './DashboardPage.css'
import { BottomNav } from './CalendarPage'
import { Bell } from 'lucide-react'
import DnevnikConnect from './DnevnikConnect'

function formatDeadline(dt) {
  if (!dt) return null
  const d = new Date(dt)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const time = d.toLocaleString('ru', { hour: '2-digit', minute: '2-digit' })
  if (isToday) return time
  return d.toLocaleString('ru', { day: 'numeric', month: 'short' }) + ', ' + time
}

function TaskItem({ task, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [steps, setSteps] = useState([])
  const [loadedSteps, setLoadedSteps] = useState(false)
  const navigate = useNavigate()

  const isOverdue = task.deadline
    && new Date(task.deadline) < new Date()
    && task.status !== 'done'

  const formatDeadline = (dt) => new Date(dt).toLocaleString('ru', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })

  const toggleExpand = async (e) => {
    e.stopPropagation()
    if (!expanded && !loadedSteps) {
      const res = await api.get(`/tasks/${task.id}/steps/`)
      setSteps(res.data)
      setLoadedSteps(true)
    }
    setExpanded(!expanded)
  }

  const toggleStep = async (e, step) => {
    e.stopPropagation()
    const res = await api.patch(`/tasks/steps/${step.id}/toggle/`)
    setSteps(steps.map(s => s.id === step.id ? { ...s, is_done: res.data.is_done } : s))
  }

  return (
    <div className="task-card">
      <div className="task-card-main">
        <button
          className={`checkbox ${task.status === 'done' ? 'checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggle(task) }}
        />
        <div
          className="task-info"
          onClick={() => navigate(`/task/${task.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <span className={`task-title ${task.status === 'done' ? 'done' : ''}`}>
            {task.title}
          </span>
          {task.deadline && (
            <span className={`task-deadline ${isOverdue ? 'overdue' : ''}`}>
              {isOverdue
                ? `Просрочено · ${formatDeadline(task.deadline)}`
                : <>{formatDeadline(task.deadline)}</>
              }
            </span>
          )}
        </div>
        <button className="expand-btn" onClick={toggleExpand}>
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="steps-list">
          {steps.length === 0 && <span className="no-steps">Нет подзадач</span>}
          {steps.map(step => (
            <div key={step.id} className="step-item">
              <button
                className={`checkbox small ${step.is_done ? 'checked' : ''}`}
                onClick={(e) => toggleStep(e, step)}
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
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/users/me/').then(r => {
      setUser(r.data)
      if (r.data.role === 'parent' && !r.data.linked_student) {
        navigate('/profile')
      }
    })
    api.get('/tasks/').then(res => setTasks(res.data))
  }, [])

  const toggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    const res = await api.patch(`/tasks/${task.id}/status/`, { status: newStatus })
    setTasks(tasks.map(t => t.id === task.id ? res.data : t))
  }

  const doneTasks = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length ? (doneTasks / tasks.length) * 100 : 0

  const days = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']
  const now = new Date()
  const dateStr = days[now.getDay()].toUpperCase() + ' · ' +
  now.toLocaleString('ru', { day: 'numeric', month: 'short' }).toUpperCase()

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="dashboard">
      <div className="header">
        <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
        <div className="header-right">
          <button className="icon-btn"><Bell size={20} color="#1a1a2e" /></button>
          <div className="avatar" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} />
        </div>
      </div>
      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
          <div className="menu-drawer">
            <div className="menu-drawer-header">
              <span>Меню</span>
              <button onClick={() => setMenuOpen(false)} className="menu-drawer-close">✕</button>
            </div>
            <button className="menu-drawer-item" onClick={() => { setMenuOpen(false); navigate('/create') }}>
              ✏️ Создать задачу вручную
            </button>
            <div className="menu-drawer-item">
              <DnevnikConnect />
            </div>
          </div>
        </>
      )}

      <div className="progress-card">
        <div className="progress-card-left">
          <div className="progress-card-date">{dateStr}</div>
            <h2>
              {user?.role === 'parent'
                ? <>Задачи<br/>ребёнка</>
                : <>Задачи на<br/>сегодня</>
              }
            </h2>
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

      <BottomNav active="home" />
    </div>
  )
}