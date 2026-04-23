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
    
    prompt = f"""You are a task classifier. Return ONLY a complete JSON object, nothing else.

Task text: "{text}"
Today: {today}

Return this exact JSON structure with all fields filled:
{{
  "title": "short task name in Russian",
  "subject": "school subject in Russian or empty string",
  "task_type": "homework or exam or project or personal or other",
  "priority": "low or medium or high",
  "deadline": "YYYY-MM-DD 23:59 or null",
  "estimated_minutes": number or null,
  "steps": ["step 1 in Russian", "step 2 in Russian", "step 3 in Russian"]
}}

Rules:
- If deadline is tomorrow set it to {today[:8]} 23:59 (replace with tomorrow)
- priority is high if urgent or deadline is tomorrow
- steps must have 2-5 items
- Respond with JSON only, no explanation"""

    response = llm.invoke(prompt)
    
    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start == -1:
            raise ValueError("No JSON found")
        json_str = response[start:end]
        result = json.loads(json_str)
        # Проверяем что все поля есть
        result.setdefault('title', text[:100])
        result.setdefault('subject', '')
        result.setdefault('task_type', 'other')
        result.setdefault('priority', 'medium')
        result.setdefault('deadline', None)
        result.setdefault('estimated_minutes', None)
        result.setdefault('steps', [])
        return result
    except Exception as e:
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
    """ИИ автоматически советует когда начать задачу"""
    
    deadline = task_data.get('deadline') or 'не указан'
    estimated = task_data.get('estimated_minutes') or 60
    today = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    busy_days = []
    for t in existing_tasks:
        if t.get('deadline'):
            busy_days.append(f"- {t['title']} (дедлайн: {t['deadline']})")
    busy_str = "\n".join(busy_days) if busy_days else "нет других задач"
    
    prompt = f"""School schedule planner. Choose the best time to START working on a task.

Today: {today}
Task deadline: {deadline}
Time needed: {estimated} minutes
Other tasks: {busy_str}

Choose a time slot:
- Weekdays: 17:00-21:00 (after school)
- Weekends: 10:00-13:00
- If no deadline: suggest tomorrow or day after
- Avoid days with other tasks if possible
- Start early enough to finish before deadline

Return ONLY datetime in format YYYY-MM-DD HH:MM, nothing else."""

    response = llm.invoke(prompt).strip()
    try:
        datetime.strptime(response[:16], "%Y-%m-%d %H:%M")
        return response[:16]
    except Exception:
        return None
