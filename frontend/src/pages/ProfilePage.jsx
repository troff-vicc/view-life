import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './ProfilePage.css'

const ROLE_LABEL = {
  student: '🎒 Ученик',
  teacher: '👨‍🏫 Учитель',
  parent: '👨‍👧 Родитель',
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

  useEffect(() => {
    api.get('/users/me/')
      .then(r => {
        setUser(r.data)
        if (r.data.role === 'parent') {
          api.get('/users/my-child/').then(c => setChild(c.data)).catch(() => {})
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
              <span>👦 Привязан: <b>{child.username}</b></span>
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