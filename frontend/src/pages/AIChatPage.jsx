import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function formatAiResponse(data) {
  const { intent, message, task } = data

  if (intent === 'create_task' && task) {
    return `✅ ${message}
📚 Предмет: ${task.subject || 'не указан'}
⚡️ Приоритет: ${task.priority}
📅 Дедлайн: ${task.deadline ? new Date(task.deadline).toLocaleString('ru') : 'не указан'}
🕐 Начать: ${task.recommended_start ? new Date(task.recommended_start).toLocaleString('ru') : 'когда удобно'}
📋 Шаги: ${task.steps?.map(s => s.title).join(', ') || 'нет'}`
  }

  if (intent === 'breakdown_task' && task) {
    const steps = task.steps?.map((s, i) => `${i + 1}. ${s.title}`).join('\n') || 'нет'
    return `✅ ${message}\n\n${steps}`
  }

  if (intent === 'suggest_time') {
    return `🕐 ${message}`
  }

  return message || 'Готово!'
}

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Привет! Я умею:\n• Создавать задачи\n• Разбивать задачи на шаги\n• Советовать время начала\n\nПросто напиши что нужно!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Используй Chrome для голосового ввода'); return }
    const r = new SR()
    r.lang = 'ru-RU'
    r.interimResults = false
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = e => setInput(e.results[0][0].transcript)
    r.onerror = e => {
      setListening(false)
      if (e.error === 'network') alert('Ошибка сети. Проверь интернет.')
      else if (e.error === 'not-allowed') alert('Разреши доступ к микрофону.')
    }
    recognitionRef.current = r
    r.start()
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const text = input.trim()
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/ai/chat/', { text })
      const aiText = formatAiResponse(res.data)
      setMessages(prev => [...prev, { role: 'ai', text: aiText, data: res.data }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ Ошибка. Попробуй ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '100%', background: '#fff' }}>
      {/* Хедер */}
      <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>←</button>
        <h3 style={{ margin: 0 }}>ИИ Ассистент</h3>
      </div>

      {/* Сообщения */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: msg.role === 'user' ? '#c6f135' : '#f0f0f0',
              color: '#222',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              maxWidth: '80%',
              whiteSpace: 'pre-line',
              fontSize: '15px',
              lineHeight: '1.5'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#f0f0f0', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', color: '#999' }}>
              ИИ думает...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Ввод */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Напиши или скажи что нужно...'
          rows={2}
          style={{ flex: 1, borderRadius: '12px', border: '1px solid #ddd', padding: '10px', resize: 'none', fontSize: '15px', outline: 'none' }}
        />
        <button
          onClick={listening ? stopListening : startListening}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: listening ? '#ff4444' : '#eee', border: 'none', fontSize: '18px', cursor: 'pointer' }}
        >
          {listening ? '⏹️' : '🎤'}
        </button>
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#c6f135', border: 'none', fontSize: '18px', cursor: 'pointer' }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}