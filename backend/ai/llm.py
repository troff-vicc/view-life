import json
from langchain_ollama import OllamaLLM
from datetime import datetime

llm = OllamaLLM(model="llama3.2:3b", temperature=0)

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
    """ИИ советует когда начать задачу"""
    
    deadline = task_data.get('deadline', 'не указан')
    estimated = task_data.get('estimated_minutes', 60)
    today = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # Готовим список занятых дней
    busy_days = []
    for t in existing_tasks:
        if t.get('deadline'):
            busy_days.append(f"- {t['title']} (дедлайн: {t['deadline']})")
    
    busy_str = "\n".join(busy_days) if busy_days else "нет других задач"
    
    prompt = f"""You are a school schedule planner. Suggest the best start time for a task.

Today: {today}
New task deadline: {deadline}
Estimated time: {estimated} minutes
Student's other tasks:
{busy_str}

Rules:
- Suggest a weekday evening (17:00-21:00) or weekend morning (10:00-13:00)
- Start at least 1 day before deadline
- Avoid days that already have tasks with close deadlines
- Return ONLY a datetime string in format: YYYY-MM-DD HH:MM
- Nothing else, just the datetime"""

    response = llm.invoke(prompt).strip()
    
    # Проверяем что это дата
    try:
        datetime.strptime(response[:16], "%Y-%m-%d %H:%M")
        return response[:16]
    except Exception:
        return None

