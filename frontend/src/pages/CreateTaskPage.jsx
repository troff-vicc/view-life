import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './CreateTaskPage.css'

const PRIORITIES = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
]

const TYPES = [
  { value: 'homework', label: '📝 Домашнее задание' },
  { value: 'exam', label: '📋 Экзамен / контрольная' },
  { value: 'project', label: '🗂 Проект' },
  { value: 'personal', label: '⭐️ Личное' },
  { value: 'other', label: '📌 Другое' },
]

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    task_type: 'homework',
  })
  const [showDeadline, setShowDeadline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Введи название задачи'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        task_type: form.task_type,
      }
      if (form.deadline) payload.deadline = form.deadline
      await api.post('/tasks/create/', payload)
      navigate('/dashboard')
    } catch {
      setError('Ошибка создания задачи')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ct-wrapper">
      <div className="ct-header">
        <button className="ct-close" onClick={() => navigate('/dashboard')}>✕</button>
        <span className="ct-title">Новая задача</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="ct-content">
        <div className="ct-card">
          <input
            className="ct-name-input"
            placeholder="Название задачи"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            maxLength={120}
          />
        </div>

        <div className="ct-card">
          <textarea
            className="ct-desc-input"
            placeholder="Описание (необязательно)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="ct-card">
          <div className="ct-label">📅 Дедлайн</div>
          {showDeadline ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="datetime-local"
                className="ct-datetime"
                value={form.deadline}
                onChange={e => setForm({ ...form, deadline: e.target.value })}
              />
              <button className="ct-clear-btn" onClick={() => {
                setForm({ ...form, deadline: '' })
                setShowDeadline(false)
              }}>✕</button>
            </div>
          ) : (
            <div className="ct-deadline-placeholder" onClick={() => setShowDeadline(true)}>
              {form.deadline
                ? new Date(form.deadline).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : 'Нажми чтобы выбрать дату →'}
            </div>
          )}
        </div>

        <div className="ct-card">
          <div className="ct-label">Приоритет</div>
          <div className="ct-priority-btns">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                className={`ct-priority-btn ${form.priority === p.value ? 'active-' + p.value : ''}`}
                onClick={() => setForm({ ...form, priority: p.value })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ct-card">
          <div className="ct-label">Тип задачи</div>
          <div className="ct-types">
            {TYPES.map(t => (
              <button
                key={t.value}
                className={`ct-type-btn ${form.task_type === t.value ? 'active' : ''}`}
                onClick={() => setForm({ ...form, task_type: t.value })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="ct-error">{error}</div>}
      </div>

      <div className="ct-footer">
        <button className="ct-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Создаём...' : 'Создать задачу'}
        </button>
      </div>
    </div>
  )
}