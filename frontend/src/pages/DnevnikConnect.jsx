import { useEffect, useState } from 'react'
import api from '../api/axios'
import './DashboardPage.css'

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

export default DnevnikConnect