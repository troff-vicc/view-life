import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './CalendarPage.css'
import { Bell, User, Home, Calendar, Plus, MessageCircle } from 'lucide-react'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function isSameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    api.get('/tasks/').then(r => setTasks(r.data)).catch(() => {})
  }, [])

  const toggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'pending' : 'done'
    const res = await api.patch(`/tasks/${task.id}/status/`, { status: newStatus })
    setTasks(tasks.map(t => t.id === task.id ? res.data : t))
  }

  const year = current.getFullYear()
  const month = current.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < startOffset; i++) {
    cells.push(new Date(year, month, 1 - startOffset + i))
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d))
  }
  while (cells.length % 7 !== 0) {
    cells.push(new Date(year, month + 1, cells.length - lastDay.getDate() - startOffset + 1))
  }

  const tasksOnDay = (day) => tasks.filter(t => {
    if (!t.deadline) return false
    return isSameDay(new Date(t.deadline), day)
  })

  const selectedTasks = tasksOnDay(selected)
  const selectedDateStr = selected.toLocaleString('ru', { day: 'numeric', month: 'long', year: 'numeric' })

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))

  return (
    <div className="cal-wrapper">
      <div className="header">
        <div className="header-title">Календарь</div>
        <div className="header-right">
          <button className="icon-btn"><Bell size={20} color="#1a1a2e" /></button>
          <div className="avatar" onClick={() => navigate('/profile')} />
        </div>
      </div>
      <div className="cal-header">
        <span className="cal-year">{year}</span>
        <div className="cal-month-nav">
          <button onClick={prevMonth} className="cal-nav-btn">‹</button>
          <span className="cal-month-name">{MONTHS[month]}</span>
          <button onClick={nextMonth} className="cal-nav-btn">›</button>
        </div>
      </div>

      <div className="cal-grid">
        {DAYS.map(d => (
          <div key={d} className={`cal-day-label ${d === 'Сб' || d === 'Вс' ? 'weekend' : ''}`}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month
          const isToday = isSameDay(day, today)
          const isSelected = isSameDay(day, selected)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6
          const hasTasks = tasksOnDay(day).length > 0

          return (
            <div
              key={i}
              className={[
                'cal-cell',
                !isCurrentMonth && 'other-month',
                isToday && 'today',
                isSelected && 'selected',
                isWeekend && isCurrentMonth && 'weekend',
              ].filter(Boolean).join(' ')}
              onClick={() => isCurrentMonth && setSelected(day)}
            >
              <span>{day.getDate()}</span>
              {hasTasks && isCurrentMonth && <div className="cal-dot" />}
            </div>
          )
        })}
      </div>

      <div className="cal-selected-date">{selectedDateStr}</div>

      {selectedTasks.map(task => (
        <div key={task.id} className="cal-task-card">
          <button
            className={`checkbox${task.status === 'done' ? ' checked' : ''}`}
            onClick={() => toggleTask(task)}
          />
          <span
            className={`cal-task-title${task.status === 'done' ? ' done' : ''}`}
            onClick={() => navigate(`/task/${task.id}`)}
          >
            {task.title}
          </span>
        </div>
      ))}

      <BottomNav active="calendar" />
    </div>
  )
}

export function BottomNav({ active }) {
  const navigate = useNavigate()
  const items = [
    { icon: <Home size={20} color="#1a1a2e" />, label: 'Главная', path: '/dashboard', key: 'home' },
    { icon: <Calendar size={20} color="#1a1a2e" />, label: 'Календарь', path: '/calendar', key: 'calendar' },
    { icon: <Plus size={20} color="#1a1a2e" />, label: '', path: '/create', key: 'create', fab: true },
    { icon: <MessageCircle size={20} color="#1a1a2e" />, label: 'ИИ', path: '/ai', key: 'ai' },
    { icon: <User size={20} color="#1a1a2e" />, label: 'Профиль', path: '/profile', key: 'profile' },
  ]
  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <button
          key={item.key}
          className={`bottom-nav-btn ${item.fab ? 'fab-btn' : ''} ${active === item.key ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          {!item.fab && <span className="bottom-nav-label">{item.label}</span>}
        </button>
      ))}
    </nav>
  )
}