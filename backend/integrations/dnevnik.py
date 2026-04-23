from datetime import datetime, timedelta


def fetch_homework(token: str) -> list:
    """Получить ДЗ на 2 недели"""
    from pydnevnikruapi.dnevnik.dnevnik import DiaryAPI
    dn = DiaryAPI(token=token)

    today = datetime.now()
    start = today - timedelta(days=today.weekday())
    end = start + timedelta(days=13)
    start_str = start.strftime('%Y-%m-%d')
    end_str = end.strftime('%Y-%m-%d')

    try:
        homework_list = dn.get_homework(start_str, end_str)
    except Exception as e:
        print(f"Ошибка получения ДЗ: {e}")
        homework_list = []

    result = []
    for hw in (homework_list or []):
        result.append({
            'title': hw.get('homework') or hw.get('title') or 'Домашнее задание',
            'subject': hw.get('subjectName') or hw.get('subject', {}).get('name', ''),
            'deadline': hw.get('toDate') or hw.get('date'),
            'description': hw.get('detail', ''),
        })
    return result


def sync_homework_to_tasks(user, token: str) -> dict:
    """Тянем ДЗ и создаём Tasks"""
    from tasks.models import Task, TaskStep
    from ai.llm import classify_task

    homework_list = fetch_homework(token)
    created = 0
    skipped = 0

    for hw in homework_list:
        title = hw['title']
        if Task.objects.filter(assigned_to=user, raw_input__icontains=title[:50]).exists():
            skipped += 1
            continue

        deadline = None
        if hw.get('deadline'):
            try:
                deadline = datetime.strptime(hw['deadline'][:10], '%Y-%m-%d')
                deadline = deadline.replace(hour=23, minute=59)
            except Exception:
                pass

        try:
            classified = classify_task(f"{hw['subject']}: {title}")
            steps = classified.get('steps', [])
            priority = classified.get('priority', 'medium')
        except Exception:
            steps = []
            priority = 'medium'

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
        for i, step_title in enumerate(steps):
            TaskStep.objects.create(task=task, title=step_title, order=i)

        created += 1

    return {'created': created, 'skipped': skipped, 'total': len(homework_list)}