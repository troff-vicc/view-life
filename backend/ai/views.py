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

    classified = classify_task(text)

    deadline = None
    if classified.get('deadline'):
        try:
            deadline = datetime.strptime(classified['deadline'], '%Y-%m-%d %H:%M')
        except Exception:
            pass

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

    for i, step_title in enumerate(classified.get('steps', [])):
        TaskStep.objects.create(task=task, title=step_title, order=i)

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


@api_view(['POST'])
def ai_chat(request):
    """
    Умный чат — ИИ сам понимает что нужно сделать:
    - создать задачу
    - разбить существующую на шаги
    - посоветовать время
    - просто ответить
    """
    from .llm import detect_intent, generate_steps_for_task, recommend_start_time

    text = request.data.get('text', '').strip()
    if not text:
        return Response({'error': 'Текст не указан'}, status=status.HTTP_400_BAD_REQUEST)

    user_tasks = list(
        (request.user.assigned_tasks.filter(status__in=['pending', 'in_progress']) |
         Task.objects.filter(created_by=request.user, status__in=['pending', 'in_progress']))
        .distinct()
        .values('id', 'title', 'subject', 'deadline')
    )

    intent_data = detect_intent(text, user_tasks)
    intent = intent_data.get('intent', 'general')
    task_id = intent_data.get('task_id')

    if intent == 'create_task':
        classified = classify_task(text)
        deadline = None
        if classified.get('deadline'):
            try:
                deadline = datetime.strptime(classified['deadline'], '%Y-%m-%d %H:%M')
            except Exception:
                pass

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
        for i, step_title in enumerate(classified.get('steps', [])):
            TaskStep.objects.create(task=task, title=step_title, order=i)

        recommended = recommend_start_time(classified, user_tasks)
        if recommended:
            try:
                task.recommended_start = datetime.strptime(recommended, '%Y-%m-%d %H:%M')
                task.save()
            except Exception:
                pass

        return Response({
            'intent': 'create_task',
            'message': f'Создал задачу "{task.title}"',
            'task': TaskSerializer(task).data,
        })

    elif intent == 'breakdown_task' and task_id:
        from django.db import models as db_models
        task = Task.objects.filter(id=task_id).filter(
            db_models.Q(assigned_to=request.user) | db_models.Q(created_by=request.user)
        ).first()
        if not task:
            return Response({'intent': 'general', 'message': 'Задача не найдена'})

        task.steps.all().delete()
        new_steps = generate_steps_for_task(task.title, task.subject)
        for i, step_title in enumerate(new_steps):
            TaskStep.objects.create(task=task, title=step_title, order=i)

        return Response({
            'intent': 'breakdown_task',
            'message': f'Разбил задачу "{task.title}" на {len(new_steps)} шагов',
            'task': TaskSerializer(task).data,
        })

    elif intent == 'suggest_time':
        task = None
        task_data = {}
        if task_id:
            try:
                task = Task.objects.get(id=task_id, assigned_to=request.user)
                task_data = {'title': task.title, 'deadline': str(task.deadline) if task.deadline else None, 'estimated_minutes': task.estimated_minutes}
            except Task.DoesNotExist:
                pass

        recommended = recommend_start_time(task_data, user_tasks)
        msg = f'Рекомендую начать: {recommended}' if recommended else 'Не могу определить лучшее время'

        return Response({
            'intent': 'suggest_time',
            'message': msg,
            'recommended_start': recommended,
        })

    else:
        return Response({
            'intent': 'general',
            'message': 'Опиши задачу — создам её, или скажи "разбей задачу X" чтобы добавить шаги.',
        })

