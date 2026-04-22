import { useState, useRef } from 'react'
import api from '../api/axios'

export default function AIChatPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Привет! Опиши задачу голосом или текстом — я помогу.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [createdTask, setCreatedTask] = useState(null)
  const recognitionRef = useRef(null)

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Голосовой ввод не поддерживается в этом браузере. Используй Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ru-RU'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
    }

    recognition.onerror = (e) => {
      setListening(false)
      console.log('Speech error:', e.error)
      
      if (e.error === 'network') {
        alert('Нет соединения с сервером распознавания. Проверь интернет и попробуй снова.')
      } else if (e.error === 'not-allowed') {
        alert('Доступ к микрофону запрещён. Разреши в настройках браузера.')
      } else if (e.error === 'no-speech') {
        // Просто замолчал — не показываем ошибку
      } else {
        alert(`Ошибка: ${e.error}`)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/ai/create-task/', { text: input })
      const task = res.data

      const aiReply = {
        role: 'ai',
        text: `✅ Создал задачу: "${task.title}"
📚 Предмет: ${task.subject || 'не указан'}
⚡️ Приоритет: ${task.priority}
📅 Дедлайн: ${task.deadline ? new Date(task.deadline).toLocaleString('ru') : 'не указан'}
🕐 Рекомендую начать: ${task.recommended_start ? new Date(task.recommended_start).toLocaleString('ru') : 'когда удобно'}
📋 Шаги: ${task.steps?.map(s => s.title).join(', ') || 'нет'}`
      }

      setMessages(prev => [...prev, aiReply])
      setCreatedTask(task)
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '❌ Ошибка. Попробуй ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div>
      <h2>ИИ Ассистент</h2>

      <div style={{ border: '1px solid #ccc', height: '400px', overflowY: 'auto', padding: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{
              display: 'inline-block',
              background: msg.role === 'user' ? '#dcf8c6' : '#f1f1f1',
              padding: '8px 12px',
              borderRadius: '8px',
              maxWidth: '80%',
              whiteSpace: 'pre-line'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left', margin: '8px 0' }}>
            <span style={{ background: '#f1f1f1', padding: '8px 12px', borderRadius: '8px' }}>
              ИИ думает...
            </span>
          </div>
        )}
      </div>

      {/* Поле ввода + кнопки */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Опиши задачу... (Enter — отправить)"
          rows={2}
          style={{ flex: 1 }}
        />

        {/* Кнопка микрофона */}
        <button
          onClick={listening ? stopListening : startListening}
          style={{
            background: listening ? '#ff4444' : '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px'
          }}
          title={listening ? 'Остановить' : 'Говорить'}
        >
          {listening ? '⏹️' : '🎤'}
        </button>

        <button onClick={sendMessage} disabled={loading}>
          {loading ? '...' : 'Отправить'}
        </button>
      </div>

      {listening && (
        <p style={{ color: 'red' }}>🔴 Слушаю... говори!</p>
      )}

      {createdTask && (
        <div style={{ marginTop: '16px', border: '1px solid green', padding: '10px' }}>
          <b>Создана задача:</b> {createdTask.title}
          <br/>
          <a href="/dashboard">← Перейти к списку задач</a>
        </div>
      )}
    </div>
  )
}