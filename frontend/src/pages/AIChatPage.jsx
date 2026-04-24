import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import './AIChatPage.css'

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
    <div className="chat-wrapper">
      <div className="chat-header">
        <button className="chat-back" onClick={() => navigate('/dashboard')}>‹</button>
        <span className="chat-title">ИИ Ассистент</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg-row ${msg.role}`}>
            <div className={`chat-bubble ${msg.role}`}>{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg-row ai">
            <div className="chat-bubble ai typing">ИИ думает...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <button
          className={`chat-mic-btn ${listening ? 'listening' : ''}`}
          onClick={listening ? stopListening : startListening}
        >
          {listening ? '⏹️' : '🎤'}
        </button>

        <input
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать Плани..."
        />

        <button
          className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          ▶️
        </button>
      </div>
    </div>
  )
}