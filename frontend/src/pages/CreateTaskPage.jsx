import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './CreateTaskPage.css'
import { Bell } from 'lucide-react'

const PRIORITIES = [
  { value: 'high',   label: 'Срочный',        color: 'red' },
  { value: 'medium', label: 'Средний',         color: 'blue' },
  { value: 'low',    label: 'Нет приоритета',  color: 'gray' },
]

const TYPES = [
  { value: 'homework', label: 'Домашняя работа' },
  { value: 'exam',     label: 'Контрольная/Экзамен' },
  { value: 'project',  label: 'Проект' },
  { value: 'personal', label: 'Личное' },
  { value: 'other',    label: 'Другое' },
]

export default function CreateTaskPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [deadline, setDeadline] = useState('')
  const [taskType, setTaskType] = useState('homework')
  const [steps, setSteps] = useState([])
  const [newStep, setNewStep] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)


  useEffect(() => {
    api.get('/users/me/').then(r => {
      if (r.data.role === 'teacher') {
        api.get('/users/my-students/').then(s => setStudents(s.data))
      }
    })
  }, [])

  const addStep = () => {
    if (!newStep.trim()) return
    setSteps([...steps, { title: newStep.trim(), is_done: false }])
    setNewStep('')
  }

  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Введи название задачи'); return }
    setLoading(true)
    setError('')
    try {
      if (students.length > 0 && !selectedStudent) {
        setError('Выбери ученика')
        return
      }
      if (selectedStudent) payload.assigned_to = selectedStudent


      const payload = { title: title.trim(), priority, task_type: taskType }
      if (deadline) payload.deadline = deadline
      const res = await api.post('/tasks/create/', payload)
      for (const step of steps) {
        await api.post(`/tasks/${res.data.id}/steps/`, { title: step.title })
      }
      navigate('/dashboard')
    } catch {
      setError('Ошибка создания задачи')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ct-page">
      <div className="ct-header">
        <button className="ct-back" onClick={() => navigate(-1)}>‹</button>
        <div className="ct-header-right">
          <button className="ct-icon-btn"><Bell size={20} color="#1a1a2e" /></button>
          <div className="ct-avatar" onClick={() => navigate('/profile')} />
        </div>
      </div>

      <input
        className="ct-title-input"
        placeholder="Введите название задачи"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={120}
      />

      <div className="ct-section-label">Приоритет</div>
      <div className="ct-priority-row">
        {PRIORITIES.map(p => (
          <button
            key={p.value}
            className={`ct-priority-btn ct-priority-${p.color}${priority === p.value ? ' active' : ''}`}
            onClick={() => setPriority(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="ct-section-label">Дедлайн</div>
      <input
        type="datetime-local"
        className="ct-deadline-input"
        value={deadline}
        onChange={e => setDeadline(e.target.value)}
      />

      <div className="ct-subtasks-header">
        <div className="ct-section-label" style={{ marginBottom: 0 }}>Подзадачи</div>
      </div>

      {steps.map((step, i) => (
        <div key={i} className="ct-step-item">
          <div className="checkbox" />
          <span className="ct-step-title">{step.title}</span>
          <button className="ct-step-remove" onClick={() => removeStep(i)}>✕</button>
        </div>
      ))}

      <div className="ct-add-step-row">
        <input
          className="ct-add-step-input"
          placeholder="Новая подзадача"
          value={newStep}
          onChange={e => setNewStep(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStep()}
        />
        <button className="ct-add-step-btn" onClick={addStep}>+</button>
      </div>
      {students.length > 0 && (
        <>
          <div className="ct-section-label">Ученик</div>
          <div className="ct-types-grid">
            {students.map(s => (
              <button
                key={s.id}
                className={`ct-type-btn${selectedStudent === s.id ? ' active' : ''}`}
                onClick={() => setSelectedStudent(s.id)}
              >
                👤 {s.username}
              </button>
            ))}
          </div>
        </>
      )}
      <div className="ct-section-label">Тип задачи</div>
      <div className="ct-types-grid">
        {TYPES.filter(t => t.value !== 'other').map(t => (
          <button
            key={t.value}
            className={`ct-type-btn${taskType === t.value ? ' active' : ''}`}
            onClick={() => setTaskType(t.value)}
          >
            {t.label}
          </button>
        ))}
        <button
          className={`ct-type-btn ct-type-full${taskType === 'other' ? ' active' : ''}`}
          onClick={() => setTaskType('other')}
        >
          Другое
        </button>
      </div>

      {error && <div className="ct-error">{error}</div>}

      <button className="ct-submit" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Создаём...' : 'Создать задачу'}
      </button>
    </div>
  )
}
