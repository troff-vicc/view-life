import asyncio
from datetime import datetime, timedelta


def run_async(coro):
    """Запускает async функцию из синхронного Django кода"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, coro)
                return future.result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


async def _get_token(login: str, password: str) -> dict:
    """Получить токен и person_id от дневник.ру"""
    from pydnevnikruapi.dnevnik import dnevnik
    dn = dnevnik.DiaryApi(login=login, password=password)
    await dn.set_token()
    
    # Получаем информацию о пользователе
    person_id = str(dn.token)  # или через dn.get_person_id()
    token = dn.token
    await dn.close()
    
    return {'token': token, 'person_id': person_id}


async def _get_homework(token: str) -> list:
    """Получить домашние задания на текущую неделю"""
    from pydnevnikruapi.dnevnik import dnevnik
    
    dn = dnevnik.DiaryApi(token=token)
    
    today = datetime.now()
    # Начало недели (понедельник)
    start = today - timedelta(days=today.weekday())
    # Конец следующей недели
    end = start + timedelta(days=13)
    
    start_str = start.strftime('%Y-%m-%d')
    end_str = end.strftime('%Y-%m-%d')
    
    try:
        homework_list = await dn.get_homework(start_str, end_str)
    except Exception as e:
        print(f"Ошибка получения ДЗ: {e}")
        homework_list = []
    
    await dn.close()
    
    result = []
    for hw in (homework_list or []):
        # Нормализуем данные из API
        result.append({
            'title': hw.get('homework') or hw.get('title') or 'Домашнее задание',
            'subject': hw.get('subjectName') or hw.get('subject', {}).get('name', ''),
            'deadline': hw.get('toDate') or hw.get('date'),
            'description': hw.get('detail', ''),
        })
    
    return result


def connect_dnevnik(login: str, password: str) -> dict:
    """Синхронная обёртка — подключить аккаунт"""
    return run_async(_get_token(login, password))


def fetch_homework(token: str) -> list:
    """Синхронная обёртка — получить ДЗ"""
    return run_async(_get_homework(token))


def sync_homework_to_tasks(user, token: str) -> dict:
    """
    Тянем ДЗ из дневник.ру и создаём Tasks.
    Возвращает количество созданных/пропущенных задач.
    """
    from tasks.models import Task, TaskStep
    from ai.llm import classify_task
    
    homework_list = fetch_homework(token)
    
    created = 0
    skipped = 0
    
    for hw in homework_list:
        title = hw['title']
        
        # Не дублируем задачи с тем же названием
        if Task.objects.filter(
            assigned_to=user,
            raw_input__icontains=title[:50]
        ).exists():
            skipped += 1
            continue
        
        # Парсим дедлайн
        deadline = None
        if hw.get('deadline'):
            try:
                deadline = datetime.strptime(hw['deadline'][:10], '%Y-%m-%d')
                deadline = deadline.replace(hour=23, minute=59)
            except Exception:
                pass
        
        # ИИ классифицирует (или базовые данные)
        try:
            classified = classify_task(f"{hw['subject']}: {title}")
            steps = classified.get('steps', [])
            priority = classified.get('priority', 'medium')
        except Exception:
            steps = []
            priority = 'medium'
        
        # Создаём задачу
        task = Task.objects.create(
            title=title,
            subject=hw.get('subject', ''),
            description=hw.get('description', ''),
            deadline=deadline,
            priority=priority,
            task_type='homework',
            raw_input=title,
            ai_generated=False,
            created_by=user,
            assigned_to=user,
        )
        
        # Создаём шаги от ИИ
        for i, step_title in enumerate(steps):
            TaskStep.objects.create(task=task, title=step_title, order=i)
        
        created += 1
    
    return {'created': created, 'skipped': skipped, 'total': len(homework_list)}
