import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './OnboardingPage.css'

const SLIDES = [
  {
    image: '/mascot2.png',
    text: 'Привет! Я – Плани, помогу тебе распланировать день и сфокусироваться на главном',
  },
  {
    image: '/mascot4.png',
    text: 'Добавляй задания как удобно: текстом, голосом или из дневника, а я подскажу, что лучше делать сейчас',
  },
  {
    image: '/mascot3.png',
    text: 'Выполняй задачи, отмечай сделанное и следи за прогрессом. Я напомню о дедлайнах и важных задачах',
  },
]

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  const isLast = current === SLIDES.length - 1

  const handleNext = () => {
    if (isLast) {
      navigate('/login')
    } else {
      setCurrent(current + 1)
    }
  }

  const slide = SLIDES[current]

  return (
    <div className="onb-wrapper">
      <div className="onb-mascot-area">
        <img
          src={slide.image}
          alt="Плани"
          className="onb-mascot"
          onError={e => e.target.style.display = 'none'}
        />
      </div>

      <div className="onb-card">
        <p className="onb-text">{slide.text}</p>

        <div className="onb-dots">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`onb-dot${i === current ? ' active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>

        <button className="onb-btn" onClick={handleNext}>
          {isLast ? 'Авторизоваться' : 'Продолжить'}
        </button>

        {isLast && (
          <p className="onb-register-link">
            нет аккаунта?{' '}
            <span onClick={() => navigate('/register')}>Зарегистрироваться</span>
          </p>
        )}
      </div>
    </div>
  )
}
