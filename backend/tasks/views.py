from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Task, TaskStep
from .serializers import TaskSerializer, TaskCreateSerializer
from .serializers import TaskStepSerializer


@api_view(['POST'])
def step_create(request, task_pk):
    """Вручную добавить шаг к задаче"""
    try:
        task = Task.objects.get(pk=task_pk)
    except Task.DoesNotExist:
        return Response({'error': 'Задача не найдена'}, status=404)

    title = request.data.get('title')
    if not title:
        return Response({'error': 'Укажи название шага'}, status=400)

    order = task.steps.count()
    step = TaskStep.objects.create(task=task, title=title, order=order)
    from .serializers import TaskStepSerializer
    return Response(TaskStepSerializer(step).data, status=201)


@api_view(['GET'])
def task_list(request):
    user = request.user
    if user.role == 'parent':
        child = user.linked_student
        if not child:
            return Response([])
        tasks = (
            Task.objects.filter(assigned_to=child) |
            Task.objects.filter(created_by=child)
        ).exclude(task_type='personal').distinct().order_by('-created_at')
    elif user.role == 'teacher':
        tasks = Task.objects.filter(
            created_by=user
        ).distinct().order_by('-created_at')
    else:
        tasks = (
            Task.objects.filter(assigned_to=user) |
            Task.objects.filter(created_by=user)
        ).distinct().order_by('-created_at')

    return Response(TaskSerializer(tasks, many=True).data)


@api_view(['POST'])
def task_create(request):
    user = request.user
    if user.role == 'parent':
        child = user.linked_student
        if not child:
            return Response({'error': 'Не привязан ребёнок'}, status=400)
        data = request.data.copy()
        serializer = TaskCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save(created_by=user, assigned_to=child)
            return Response(TaskSerializer(task).data, status=201)
        return Response(serializer.errors, status=400)
    elif user.role == 'teacher':
        student_id = request.data.get('assigned_to')
        if not student_id:
            return Response({'error': 'Укажи ученика'}, status=400)
        try:
            from users.models import User
            student = User.objects.get(id=student_id, linked_teacher=user)
        except User.DoesNotExist:
            return Response({'error': 'Ученик не найден или не привязан к вам'}, status=404)
        serializer = TaskCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save(created_by=user, assigned_to=student)
            return Response(TaskSerializer(task).data, status=201)
        return Response(serializer.errors, status=400)
    else:
        serializer = TaskCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            task = serializer.save()
            return Response(TaskSerializer(task).data, status=201)
        return Response(serializer.errors, status=400)


def can_access_task(user, task):
    if user.role == 'parent':
        child = user.linked_student
        if not child or task.task_type == 'personal':
            return False
        return task.assigned_to == child or task.created_by == child
    if user.role == 'teacher':
        return task.created_by == user
    return task.assigned_to == user or task.created_by == user


@api_view(['GET', 'PATCH', 'DELETE'])
def task_detail(request, pk):
    """Получить / обновить / удалить задачу"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({'error': 'Задача не найдена'}, status=status.HTTP_404_NOT_FOUND)

    if not can_access_task(request.user, task):
        return Response({'error': 'Нет доступа'}, status=403)

    if request.method == 'GET':
        return Response(TaskSerializer(task).data)

    if request.method == 'PATCH':
        serializer = TaskCreateSerializer(task, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
def task_status(request, pk):
    """Изменить статус задачи (pending / in_progress / done)"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({'error': 'Задача не найдена'}, status=status.HTTP_404_NOT_FOUND)

    if not can_access_task(request.user, task):
        return Response({'error': 'Нет доступа'}, status=403)

    new_status = request.data.get('status')
    if new_status not in ['pending', 'in_progress', 'done']:
        return Response({'error': 'Неверный статус'}, status=status.HTTP_400_BAD_REQUEST)

    task.status = new_status
    if new_status == 'done':
        task.points_awarded = 10
    task.save()
    return Response(TaskSerializer(task).data)


@api_view(['PATCH'])
def step_toggle(request, pk):
    """Отметить шаг выполненным / не выполненным"""
    try:
        step = TaskStep.objects.get(pk=pk)
    except TaskStep.DoesNotExist:
        return Response({'error': 'Шаг не найден'}, status=status.HTTP_404_NOT_FOUND)

    step.is_done = not step.is_done
    step.save()
    return Response({'id': step.id, 'is_done': step.is_done})


@api_view(['GET', 'POST'])
def task_steps(request, task_pk):
    """Получить шаги задачи / добавить новый шаг вручную"""
    try:
        task = Task.objects.get(pk=task_pk)
    except Task.DoesNotExist:
        return Response({'error': 'Задача не найдена'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        steps = task.steps.all()
        return Response(TaskStepSerializer(steps, many=True).data)

    if request.method == 'POST':
        title = request.data.get('title', '').strip()
        if not title:
            return Response({'error': 'Укажи название шага'}, status=status.HTTP_400_BAD_REQUEST)

        order = task.steps.count()
        step = TaskStep.objects.create(task=task, title=title, order=order)
        return Response(TaskStepSerializer(step).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
def step_detail(request, pk):
    """Редактировать / удалить шаг"""
    try:
        step = TaskStep.objects.get(pk=pk)
    except TaskStep.DoesNotExist:
        return Response({'error': 'Шаг не найден'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        title = request.data.get('title')
        if title:
            step.title = title.strip()
            step.save()
        return Response(TaskStepSerializer(step).data)

    if request.method == 'DELETE':
        step.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
        