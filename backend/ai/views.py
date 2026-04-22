from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .llm import classify_task
from tasks.models import Task, TaskStep
from tasks.serializers import TaskSerializer
from datetime import datetime


@api_view(['POST'])
def ai_create_task(request):
    """Создать задачу из текста через ИИ"""
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Текст не указан'}, status=status.HTTP_400_BAD_REQUEST)

    # ИИ классифицирует
    classified = classify_task(text)

    # Парсим дедлайн
    deadline = None
    if classified.get('deadline'):
        try:
            deadline = datetime.strptime(classified['deadline'], '%Y-%m-%d %H:%M')
        except Exception:
            pass

    # Создаём задачу
    task = Task.objects.create(
        title=classified.get('title', text[:100]),
        subject=classified.get('subject', ''),
        task_type=classified.get('task_type', 'other'),
        priority=classified.get('priority', 'medium'),
        deadline=deadline,
        estimated_minutes=classified.get('estimated_minutes'),
        raw_input=text,
        ai_generated=True,
        created_by=request.user,
        assigned_to=request.user,
    )

    existing = list(request.user.assigned_tasks.filter(
	    status__in=['pending', 'in_progress']
	).values('title', 'deadline'))

# ИИ советует время начала
from .llm import recommend_start_time
recommended = recommend_start_time(classified, existing)
if recommended:
    from datetime import datetime
    try:
        task.recommended_start = datetime.strptime(recommended, '%Y-%m-%d %H:%M')
        task.save()
    except Exception:
        pass

    # Создаём шаги
    for i, step_title in enumerate(classified.get('steps', [])):
        TaskStep.objects.create(task=task, title=step_title, order=i)

    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def ai_classify_only(request):
    """Только классификация без сохранения — для превью"""
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Текст не указан'}, status=status.HTTP_400_BAD_REQUEST)
    result = classify_task(text)
    return Response(result)