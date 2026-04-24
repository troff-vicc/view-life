import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './DashboardPage.css'
import { BottomNav } from './CalendarPage'
import { Bell } from 'lucide-react'

function DnevnikConnect() {
  const [connected, setConnected] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    api.get('/integrations/dnevnik/status/')
      .then(r => {
        setConnected(r.data.connected)
        setLastSync(r.data.last_sync)
      })
      .catch(() => {})
  }, [])

  const handleSave = () => {
    if (!token.trim()) return
    setSaving(true)
    api.post('/integrations/dnevnik/connect/', { token: token.trim() })
      .then(() => {
        setConnected(true)
        setShowForm(false)
        setToken('')
      })
      .catch(() => alert('Ошибка: неверный токен'))
      .finally(() => setSaving(false))
  }

  const handleSync = () => {
    setSyncing(true)
    api.post('/integrations/dnevnik/sync/')
      .then(r => alert(`Готово! Создано задач: ${r.data.created}, пропущено: ${r.data.skipped}`))
      .catch(e => alert('Ошибка синхронизации: ' + (e.response?.data?.error || 'неизвестная')))
      .finally(() => setSyncing(false))
  }

  const handleDisconnect = () => {
    api.delete('/integrations/dnevnik/disconnect/')
      .then(() => { setConnected(false); setLastSync(null) })
  }

  if (connected) return (
    <div style={{ background: '#f0edff', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>📚</span>
        <span style={{ fontWeight: 600, color: '#5b4fcf' }}>Дневник.ру подключён</span>
      </div>
      {lastSync && <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
        Последняя синхронизация: {new Date(lastSync).toLocaleString('ru')}
      </div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSync} disabled={syncing} style={{
          background: '#5b4fcf', color: '#fff', border: 'none',
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13
        }}>
          {syncing ? 'Загружаю...' : '🔄 Загрузить ДЗ'}
        </button>
        <button onClick={handleDisconnect} style={{
          background: 'none', border: '1px solid #ccc', borderRadius: 8,
          padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#666'
        }}>Отключить</button>
      </div>
    </div>
  )

  return (
    <div>
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="dnevnik-btn-primary">
          📚 Подключить Дневник.ру
        </button>
      ) : (
        <div className="dnevnik-block">
          <div className="dnevnik-title">📚 Подключить Дневник.ру</div>
          <div className="dnevnik-instructions">
            Как получить токен:<br/>
            1. Войди на <b>dnevnik.ru</b><br/>
            2. Нажми <b>F12</b> → вкладка <b>Application</b><br/>
            3. Слева: <b>Local Storage → https://dnevnik.ru</b><br/>
            4. Найди строку <b>access_token</b> → скопируй значение
          </div>
          <input
            type="text"
            placeholder="Вставь access_token сюда"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="dnevnik-token-input"
          />
          <div className="dnevnik-btn-row">
            <button
              onClick={handleSave}
              disabled={saving || !token.trim()}
              className="dnevnik-btn-secondary"
            >
              {saving ? 'Сохраняю...' : 'Подключить'}
            </button>
            <button
              onClick={() => { setShowForm(false); setToken('') }}
              className="dnevnik-btn-outline"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
  const navigate = useNavigate()

  useEffect(() => {
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
          <h2>Задачи на<br/>сегодня</h2>
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