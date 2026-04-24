import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './ProfilePage.css'

const ROLE_LABEL = {
  student: 'Ученик',
  teacher: 'Учитель',
  parent: 'Родитель',
}

const menuItems = [
  { icon: '👨‍🏫', label: 'Учитель', path: '/teacher' },
  { icon: '👨‍👧', label: 'Родители', path: '/parent' },
  { icon: '🔗', label: 'Интеграции', path: '/integrations' },
  { icon: '❓', label: 'Помощь', path: '/help' },
  { icon: '⚙️', label: 'Настройки', path: '/settings' },
]

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const [child, setChild] = useState(null)
  const [childInput, setChildInput] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [teacher, setTeacher] = useState(null)
  const [teacherInput, setTeacherInput] = useState('')
  const [teacherLoading, setTeacherLoading] = useState(false)
  const [teacherError, setTeacherError] = useState('')

  useEffect(() => {
    api.get('/users/me/')
      .then(r => {
        setUser(r.data)
        if (r.data.role === 'parent') {
          api.get('/users/my-child/').then(c => setChild(c.data)).catch(() => {})
        }
        if (r.data.role === 'student' && r.data.linked_teacher_username) {
          setTeacher({ username: r.data.linked_teacher_username })
        }
      })
      .catch(() => navigate('/login'))
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const handleLinkChild = async () => {
    if (!childInput.trim()) return
    setLinkLoading(true)
    setLinkError('')
    try {
      await api.post('/users/link-child/', { username: childInput.trim() })
      const c = await api.get('/users/my-child/')
      setChild(c.data)
      setChildInput('')
    } catch (e) {
      setLinkError(e.response?.data?.error || 'Ошибка')
    } finally {
      setLinkLoading(false)
    }
  }

  const handleLinkTeacher = async () => {
    if (!teacherInput.trim()) return
    setTeacherLoading(true)
    setTeacherError('')
    try {
      const res = await api.post('/users/link-teacher/', { username: teacherInput.trim() })
      setTeacher({ username: res.data.teacher_username })
      setTeacherInput('')
    } catch (e) {
      setTeacherError(e.response?.data?.error || 'Ошибка')
    } finally {
      setTeacherLoading(false)
    }
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-header">
        <button className="profile-back" onClick={() => navigate('/dashboard')}>‹</button>
        <span className="profile-title">Профиль</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="profile-avatar-block">
        <div className="profile-avatar">
          {user?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="profile-name">{user?.username || '...'}</div>
        <div className="profile-role">{ROLE_LABEL[user?.role] || ''}</div>
      </div>

      {user?.role === 'parent' && (
        <div className="profile-child-block">
          {child?.linked ? (
            <div className="profile-child-linked">
              <span>Привязан: <b>{child.username}</b></span>
            </div>
          ) : (
            <div className="profile-child-form">
              <div className="profile-child-title">Привяжи аккаунт ребёнка</div>
              <input
                className="profile-child-input"
                placeholder="Username ученика"
                value={childInput}
                onChange={e => setChildInput(e.target.value)}
              />
              {linkError && <div className="profile-child-error">{linkError}</div>}
              <button
                className="profile-child-btn"
                onClick={handleLinkChild}
                disabled={linkLoading}
              >
                {linkLoading ? 'Привязываю...' : 'Привязать'}
              </button>
            </div>
          )}
        </div>
      )}

      {user?.role === 'student' && (
        <div className="profile-child-block">
          {teacher ? (
            <div className="profile-child-linked">
              <span>Учитель: <b>{teacher.username}</b></span>
            </div>
          ) : (
            <div className="profile-child-form">
              <div className="profile-child-title">Привязать учителя</div>
              <input
                className="profile-child-input"
                placeholder="Username учителя"
                value={teacherInput}
                onChange={e => setTeacherInput(e.target.value)}
              />
              {teacherError && <div className="profile-child-error">{teacherError}</div>}
              <button
                className="profile-child-btn"
                onClick={handleLinkTeacher}
                disabled={teacherLoading}
              >
                {teacherLoading ? 'Привязываю...' : 'Привязать'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="profile-menu">
        {menuItems.map(item => (
          <button
            key={item.path}
            className="profile-menu-item"
            onClick={() => navigate(item.path)}
          >
            <span className="profile-menu-icon">{item.icon}</span>
            <span className="profile-menu-label">{item.label}</span>
            <span className="profile-menu-arrow">›</span>
          </button>
        ))}
      </div>

      <button className="profile-logout" onClick={handleLogout}>
        Выйти из аккаунта
      </button>
    </div>
  )
}