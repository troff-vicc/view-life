import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './TaskDetailPage.css'

const PRIORITY_LABEL = { high: 'Высокий приоритет', medium: 'Средний приоритет', low: 'Низкий приоритет' }
const PRIORITY_CLASS = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' }
const TYPE_OPTIONS = [
  { value: 'homework', label: '📝 Домашнее задание' },
  { value: 'exam', label: '📋 Экзамен / контрольная' },
  { value: 'project', label: '🗂 Проект' },
  { value: 'personal', label: '⭐️ Личное' },
  { value: 'other', label: '📌 Другое' },
]

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/tasks/${id}/`),
      api.get(`/tasks/${id}/steps/`)
    ]).then(([taskRes, stepsRes]) => {
      setTask(taskRes.data)
      setSteps(stepsRes.data)
    }).catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleStep = (stepId) => {
    api.patch(`/tasks/steps/${stepId}/toggle/`).then(res => {
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, is_done: res.data.is_done } : s))
    })
  }

  const handleComplete = () => {
    setCompleting(true)
    const newStatus = task.status === 'done' ? 'in_progress' : 'done'
    api.patch(`/tasks/${id}/status/`, { status: newStatus })
      .then(() => setTask(prev => ({ ...prev, status: newStatus })))
      .finally(() => setCompleting(false))
  }

  const handleTypeChange = (e) => {
    const newType = e.target.value
    api.patch(`/tasks/${id}/`, { task_type: newType })
      .then(() => setTask(prev => ({ ...prev, task_type: newType })))
  }

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  const formatDeadline = (dt) => {
    if (!dt) return null
    const d = new Date(dt)
    return d.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const formatRecommended = (dt) => {
    if (!dt) return null
    const d = new Date(dt)
    return d.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const doneCount = steps.filter(s => s.is_done).length

  if (loading) return <div className="td-loading">Загрузка...</div>
  if (!task) return null

  return (
    <div className="td-wrapper">
      <div className="td-header">
        <button className="td-back" onClick={() => navigate('/dashboard')}>‹</button>
        <span className="td-title">Задача</span>
        <button className="td-logout" onClick={handleLogout}>⏻</button>
      </div>

      <div className="td-content">
        <span className={`td-priority ${PRIORITY_CLASS[task.priority]}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>

        <h1 className="td-name">{task.title}</h1>

        <div className="td-section">
  <div className="td-section-label">📅 Дедлайн</div>
  {editingDeadline ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        type="datetime-local"
        className="td-type-select"
        defaultValue={task.deadline ? task.deadline.slice(0, 16) : ''}
        onChange={e => {
          const val = e.target.value
          if (!val) return
          api.patch(`/tasks/${id}/`, { deadline: val })
            .then(() => {
              setTask(prev => ({ ...prev, deadline: val }))
              setEditingDeadline(false)
            })
        }}
      />
      <button
        onClick={() => {
          api.patch(`/tasks/${id}/`, { deadline: null })
            .then(() => {
              setTask(prev => ({ ...prev, deadline: null }))
              setEditingDeadline(false)
            })
        }}
        style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 18 }}
      >✕</button>
    </div>
  ) : (
    <div
      className="td-deadline-value"
      onClick={() => setEditingDeadline(true)}
      style={{ cursor: 'pointer' }}
    >
      {task.deadline
        ? <><span className="td-dot" />{formatDeadline(task.deadline)} <span style={{color:'#bbb',fontSize:12}}>✎</span></>
        : <span style={{ color: '#bbb', fontSize: 14 }}>Нажми чтобы добавить дату →</span>
      }
    </div>
  )}
</div>

        {steps.length > 0 && (
          <div className="td-steps-block">
            <div className="td-steps-header">
              Подзадачи
              <span className="td-steps-count">{doneCount}/{steps.length}</span>
            </div>
            <div className="td-steps-progress">
              <div
                className="td-steps-bar"
                style={{ width: steps.length ? `${(doneCount / steps.length) * 100}%` : '0%' }}
              />
            </div>
            <div className="td-steps-list">
              {steps.map(step => (
                <div
                  key={step.id}
                  className={`td-step ${step.is_done ? 'done' : ''}`}
                  onClick={() => toggleStep(step.id)}
                >
                  <span className={`td-checkbox ${step.is_done ? 'checked' : ''}`}>
                    {step.is_done ? '✓' : ''}
                  </span>
                  <span className="td-step-title">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {task.description ? (
          <div className="td-section">
            <div className="td-section-label">Описание</div>
            <div className="td-description">{task.description}</div>
          </div>
        ) : null}

        {task.recommended_start && (
          <div className="td-section">
            <div className="td-section-label">⏰ ИИ рекомендует начать</div>
            <div className="td-rec-time">{formatRecommended(task.recommended_start)}</div>
          </div>
        )}

        <div className="td-section">
          <div className="td-section-label">Тип задачи</div>
          <select
            className="td-type-select"
            value={task.task_type}
            onChange={handleTypeChange}
          >
            {TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="td-footer">
        <button
          className={task.status === 'done' ? 'td-undo-btn' : 'td-complete-btn'}
          onClick={handleComplete}
          disabled={completing}
        >
          {completing ? 'Сохраняю...' : task.status === 'done' ? '↩️ Вернуть в работу' : 'Выполнить'}
        </button>
      </div>
    </div>
  )
}