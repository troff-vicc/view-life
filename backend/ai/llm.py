import json
from langchain_ollama import OllamaLLM
from datetime import datetime
import json
from langchain_ollama import OllamaLLM
from datetime import datetime
from django.conf import settings

llm = OllamaLLM(
    model=settings.OLLAMA_MODEL,
    base_url=settings.OLLAMA_BASE_URL,
    temperature=0
)

def classify_task(text: str) -> dict:
    today = datetime.now().strftime("%Y-%m-%d")

    prompt = f"""Ты помощник школьника. Проанализируй сообщение и извлеки задачу.

Сообщение пользователя: "{text}"
Сегодня: {today}

ВАЖНО: Пользователь мог написать команду типа "добавь задачу", "создай", "напомни" — игнорируй слова-команды, извлеки только СУТЬ задачи.

Примеры:
- "добавить задачу сходить в магазин" → title: "Сходить в магазин"
- "создай задачу написать сочинение по литературе" → title: "Написать сочинение по литературе"
- "нужно подготовиться к контрольной по математике в пятницу" → title: "Подготовиться к контрольной по математике"

Верни ТОЛЬКО JSON без объяснений:
{{
  "title": "суть задачи на русском (без слов-команд)",
  "subject": "школьный предмет или пустая строка",
  "task_type": "homework или exam или project или personal или other",
  "priority": "low или medium или high",
  "deadline": "YYYY-MM-DD 23:59 или null",
  "estimated_minutes": число или null,
  "steps": ["шаг 1", "шаг 2", "шаг 3"]
}}

Правила:
- title — только суть, 2-6 слов, без команд
- steps — 2-4 конкретных шага на русском, без галлюцинаций
- priority high — если срочно или дедлайн завтра
- Только JSON, никаких пояснений"""

    response = llm.invoke(prompt)

    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start == -1:
            raise ValueError("No JSON found")
        result = json.loads(response[start:end])
        result.setdefault('title', text[:100])
        result.setdefault('subject', '')
        result.setdefault('task_type', 'other')
        result.setdefault('priority', 'medium')
        result.setdefault('deadline', None)
        result.setdefault('estimated_minutes', None)
        result.setdefault('steps', [])
        return result
    except Exception:
        return {
            "title": text[:100],
            "subject": "",
            "task_type": "other",
            "priority": "medium",
            "deadline": None,
            "estimated_minutes": None,
            "steps": []
        }


def recommend_start_time(task_data: dict, existing_tasks: list) -> str | None:
    deadline = task_data.get('deadline') or 'не указан'
    estimated = task_data.get('estimated_minutes') or 60
    today = datetime.now().strftime("%Y-%m-%d %H:%M")

    busy_days = []
    for t in existing_tasks:
        if t.get('deadline'):
            busy_days.append(f"- {t['title']} (дедлайн: {t['deadline']})")
    busy_str = "\n".join(busy_days) if busy_days else "нет других задач"

    prompt = f"""Ты планировщик для школьника. Подбери лучшее время начать работу над задачей.

Сейчас: {today}
Дедлайн задачи: {deadline}
Нужно времени: {estimated} минут
Другие задачи: {busy_str}

Правила выбора времени:
- Будни: 17:00–21:00 (после школы)
- Выходные: 10:00–13:00
- Начни заранее, чтобы успеть до дедлайна
- Если нет дедлайна — предложи завтра или послезавтра
- Избегай дней с другими задачами если возможно

Верни ТОЛЬКО дату и время в формате YYYY-MM-DD HH:MM, больше ничего."""

    response = llm.invoke(prompt).strip()
    try:
        datetime.strptime(response[:16], "%Y-%m-%d %H:%M")
        return response[:16]
    except Exception:
        return None
        

def detect_intent(text: str, user_tasks: list) -> dict:
    tasks_str = "\n".join([
        f"- id={t['id']}: {t['title']}"
        for t in user_tasks
    ]) if user_tasks else "нет задач"

    prompt = f"""Ты классификатор намерений для трекера задач школьника. Верни ТОЛЬКО JSON.

Сообщение: "{text}"

Задачи пользователя:
{tasks_str}

Верни JSON:
{{
  "intent": "create_task или breakdown_task или suggest_time или general",
  "task_id": число или null
}}

Правила:
- create_task: пользователь описывает новое задание, экзамен, дедлайн, дело
- breakdown_task: хочет разбить задачу на шаги (разбей, подзадачи, как выполнить, помоги с)
- suggest_time: спрашивает когда делать (когда, во сколько, успею ли, лучшее время)
- general: всё остальное
- task_id: если breakdown_task или suggest_time — найди id задачи из списка выше, иначе null
- Только JSON, никаких пояснений"""

    response = llm.invoke(prompt)

    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start == -1:
            raise ValueError("No JSON found")
        result = json.loads(response[start:end])
        result.setdefault('intent', 'general')
        result.setdefault('task_id', None)
        return result
    except Exception:
        return {'intent': 'general', 'task_id': None}


def generate_steps_for_task(task_title: str, task_subject: str) -> list:
    prompt = f"""Ты помощник школьника. Составь пошаговый план выполнения задачи.

Задача: "{task_title}"
Предмет: "{task_subject or 'не указан'}"

Верни ТОЛЬКО JSON без объяснений:
{{
  "steps": ["шаг 1", "шаг 2", "шаг 3", "шаг 4"]
}}

Правила:
- 3-5 конкретных шагов на русском языке
- Шаги логичны: подготовка → выполнение → проверка
- Каждый шаг — 3-8 слов, чёткий и понятный
- Никаких галлюцинаций, только реальные действия
- Только JSON, никаких пояснений"""

    response = llm.invoke(prompt)

    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start == -1:
            raise ValueError("No JSON found")
        result = json.loads(response[start:end])
        return result.get('steps', [])
    except Exception:
        return ["Подготовиться к выполнению", "Выполнить задание", "Проверить результат"]

