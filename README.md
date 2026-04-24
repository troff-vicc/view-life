# 📚 Плани — Умный трекер учебных задач

> Проект для хакатона WATA, трек «Школьники»

**Плани** — мобильное веб-приложение для школьников, которое помогает управлять учебными задачами с помощью ИИ: создаёт задачи по голосу или тексту, разбивает их на шаги и рекомендует оптимальное время начала.

---

## 🚀 Возможности

- **ИИ-ассистент** — создаёт задачи из текста или голоса, разбивает на подзадачи, рекомендует время начала
- **Умный трекер** — список задач с приоритетами, дедлайнами, статусами и прогрессом
- **Подзадачи** — чекбоксы с прогресс-баром, добавление вручную
- **Классификация** — автоматическое определение типа (ДЗ / экзамен / проект / личное)
- **Интеграция с Дневник.ру** — импорт домашних заданий
- **Голосовой ввод** — Web Speech API (Chrome)
- **Роли** — ученик, учитель, родитель

---

## 🛠 Стек

| Часть | Технологии |
|-------|-----------|
| Backend | Python 3.12, Django 6, Django REST Framework, JWT |
| Frontend | React 18, Vite, axios, react-router-dom |
| ИИ | Ollama (llama3.1:8b), LangChain |
| БД | SQLite (dev) |

---

## 📁 Структура проекта

```
view-life/
├── backend/
│   ├── config/          # Настройки Django, URL-маршруты
│   ├── users/           # Модель пользователя, JWT авторизация
│   ├── tasks/           # Задачи (Task), подзадачи (TaskStep), CRUD API
│   ├── ai/              # ИИ: классификация, разбивка, рекомендации
│   └── integrations/    # Интеграция с Дневник.ру
└── frontend/
    └── src/
        ├── api/         # axios с автоподстановкой токена
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx
            ├── TaskDetailPage.jsx
            ├── CreateTaskPage.jsx
            ├── AIChatPage.jsx
            └── ProfilePage.jsx
```

---

## ⚙️ Установка и запуск

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ollama (ИИ)

```bash
# Установи Ollama: https://ollama.com
ollama pull llama3.1:8b
ollama serve
```

---

## 🔌 API

| Метод | Маршрут | Описание |
|-------|---------|----------|
| POST | `/api/users/register/` | Регистрация |
| POST | `/api/users/login/` | Вход (JWT) |
| GET | `/api/users/me/` | Текущий пользователь |
| GET | `/api/tasks/` | Список задач |
| POST | `/api/tasks/create/` | Создать задачу вручную |
| GET/PATCH/DELETE | `/api/tasks/<id>/` | Детали / обновление / удаление |
| PATCH | `/api/tasks/<id>/status/` | Изменить статус |
| GET/POST | `/api/tasks/<id>/steps/` | Подзадачи |
| PATCH | `/api/tasks/steps/<id>/toggle/` | Отметить подзадачу |
| POST | `/api/ai/chat/` | ИИ-чат (роутинг по intent) |
| POST | `/api/ai/create-task/` | Создать задачу через ИИ |
| POST | `/api/integrations/dnevnik/connect/` | Подключить Дневник.ру |
| POST | `/api/integrations/dnevnik/sync/` | Синхронизировать ДЗ |

---

## 🤖 Как работает ИИ

1. Пользователь пишет или говорит: *«Нужно подготовиться к контрольной по физике в пятницу»*
2. ИИ определяет **intent**: создать задачу / разбить / рекомендовать время
3. Задача автоматически **классифицируется** (тип, приоритет, дедлайн)
4. Генерируются **подзадачи** (шаги выполнения)
5. Рассчитывается **рекомендуемое время начала** с учётом других задач

---

## 📱 Скриншоты

> Добавь скриншоты приложения

---

## 👥 Команда

> Хакатон WATA — трек «Школьники»
