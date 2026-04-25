import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { BottomNav } from './CalendarPage'
import './ProfilePage.css'

const ROLE_LABEL = {
  student: 'ученик',
  teacher: 'учитель',
  parent: 'родитель',
}

const menuItems = [
  { label: 'Интеграции', path: '/integrations' },
  { label: 'Служба поддержки', path: '/help' },
  { label: 'Настройки', path: '/settings' },
]

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [linkValue, setLinkValue] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkedName, setLinkedName] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/users/me/')
      .then(r => {
        setUser(r.data)
        if (r.data.role === 'student' && r.data.linked_teacher_username) {
          setLinkedName(r.data.linked_teacher_username)
        }
        if (r.data.role === 'parent') {
          api.get('/users/my-child/').then(c => {
            if (c.data.linked) setLinkedName(c.data.username)
          }).catch(() => {})
        }
      })
      .catch(() => navigate('/login'))
  }, [])

  const handleLink = async () => {
    if (!linkValue.trim()) return
    setLinkLoading(true)
    setLinkError('')
    try {
      if (user.role === 'student') {
        const res = await api.post('/users/link-teacher/', { username: linkValue.trim() })
        setLinkedName(res.data.teacher_username)
      } else if (user.role === 'parent') {
        const res = await api.post('/users/link-child/', { username: linkValue.trim() })
        setLinkedName(res.data.child_username)
      }
      setLinkValue('')
    } catch (e) {
      setLinkError(e.response?.data?.error || 'Ошибка')
    } finally {
      setLinkLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const linkLabel = user?.role === 'student' ? 'учителя' : 'ребёнка'
  const linkPlaceholder = user?.role === 'student' ? 'Username учителя' : 'Username ребёнка'

  return (
    <div className="profile-page">
      {/* Banner */}
      <div className="profile-banner">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {user?.username?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      </div>

      <div className="profile-content">
        {/* Name + role */}
        <div className="profile-name">{user?.username || '...'}</div>
        <div className="profile-role">{ROLE_LABEL[user?.role] || ''}</div>

        {(user?.role === 'student' || user?.role === 'parent') && (
          <div className="profile-link-block">
            {linkedName ? (
              <div className="profile-linked-row">
                <span className="profile-linked-label">
                  {user.role === 'student' ? 'Учитель' : 'Ребёнок'}:
                </span>
                <span className="profile-linked-name">{linkedName}</span>
              </div>
            ) : (
              <>
                <div className="profile-link-row">
                  <input
                    className="profile-link-input"
                    placeholder={linkPlaceholder}
                    value={linkValue}
                    onChange={e => setLinkValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLink()}
                  />
                  <button
                    className="profile-link-btn"
                    onClick={handleLink}
                    disabled={linkLoading}
                  >
                    {linkLoading ? '...' : `Добавить ${linkLabel}`}
                  </button>
                </div>
                {linkError && <div className="profile-link-error">{linkError}</div>}
              </>
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
              {item.label}
            </button>
          ))}
        </div>

        <button className="profile-logout" onClick={handleLogout}>
          Выйти из аккаунта
        </button>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
