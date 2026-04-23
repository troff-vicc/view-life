from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .llm import classify_task, recommend_start_time
from tasks.models import Task, TaskStep
from tasks.serializers import TaskSerializer
from datetime import datetime


@api_view(['POST'])
def ai_create_task(request):
    """Создать задачу из текста через ИИ"""
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Текст не указан'}, status=status.HTTP_400_BAD_REQUEST)

    # ИИ классифицирует задачу
    classified = classify_task(text)

    # Парсим дедлайн если ИИ его нашёл в тексте
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

    # Создаём шаги от ИИ
    for i, step_title in enumerate(classified.get('steps', [])):
        TaskStep.objects.create(task=task, title=step_title, order=i)

    # Автоматически советуем время начала если пользователь не назвал его
    existing = list(request.user.assigned_tasks.filter(
        status__in=['pending', 'in_progress']
    ).exclude(id=task.id).values('title', 'deadline'))

    recommended = recommend_start_time(classified, existing)
    if recommended:
        try:
            task.recommended_start = datetime.strptime(recommended, '%Y-%m-%d %H:%M')
            task.save()
        except Exception:
            pass

    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def ai_classify_only(request):
    """Только классификация без сохранения — для превью"""
    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Текст не указан'}, status=status.HTTP_400_BAD_REQUEST)
    result = classify_task(text)
    return Response(result)