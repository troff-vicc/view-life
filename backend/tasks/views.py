from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Task, TaskStep
from .serializers import TaskSerializer, TaskCreateSerializer


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
    """Список задач текущего пользователя"""
    tasks = Task.objects.filter(assigned_to=request.user) | \
            Task.objects.filter(created_by=request.user)
    tasks = tasks.distinct().order_by('-created_at')
    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def task_create(request):
    """Создать задачу вручную"""
    serializer = TaskCreateSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        task = serializer.save()
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
def task_detail(request, pk):
    """Получить / обновить / удалить задачу"""
    try:
        task = Task.objects.get(pk=pk)
    except Task.DoesNotExist:
        return Response({'error': 'Задача не найдена'}, status=status.HTTP_404_NOT_FOUND)

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

    new_status = request.data.get('status')
    if new_status not in ['pending', 'in_progress', 'done']:
        return Response({'error': 'Неверный статус'}, status=status.HTTP_400_BAD_REQUEST)

    task.status = new_status
    if new_status == 'done':
        task.points_awarded = 10  # баллы за выполнение
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