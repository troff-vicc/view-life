from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import DnevnikAccount
from .dnevnik import connect_dnevnik, sync_homework_to_tasks


@api_view(['POST'])
def dnevnik_connect(request):
    """
    Подключить аккаунт дневник.ру
    Тело: {"login": "...", "password": "..."}
    """
    login = request.data.get('login', '').strip()
    password = request.data.get('password', '').strip()

    if not login or not password:
        return Response({'error': 'Укажи логин и пароль'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = connect_dnevnik(login, password)
    except Exception as e:
        return Response({'error': f'Не удалось подключиться: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # Сохраняем токен
    account, created = DnevnikAccount.objects.update_or_create(
        user=request.user,
        defaults={
            'access_token': result['token'],
            'person_id': result.get('person_id', ''),
        }
    )

    return Response({
        'message': 'Аккаунт дневник.ру подключён успешно',
        'connected_at': account.connected_at,
    })


@api_view(['POST'])
def dnevnik_sync(request):
    """
    Синхронизировать ДЗ из дневник.ру
    Создаёт задачи автоматически
    """
    try:
        account = DnevnikAccount.objects.get(user=request.user)
    except DnevnikAccount.DoesNotExist:
        return Response(
            {'error': 'Сначала подключи аккаунт дневник.ру'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        result = sync_homework_to_tasks(request.user, account.access_token)
    except Exception as e:
        return Response({'error': f'Ошибка синхронизации: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Обновляем время последней синхронизации
    account.last_sync = timezone.now()
    account.save()

    return Response({
        'message': f'Синхронизация завершена',
        'created': result['created'],
        'skipped': result['skipped'],
        'total_from_diary': result['total'],
    })


@api_view(['GET'])
def dnevnik_status(request):
    """Проверить статус подключения"""
    try:
        account = DnevnikAccount.objects.get(user=request.user)
        return Response({
            'connected': True,
            'connected_at': account.connected_at,
            'last_sync': account.last_sync,
        })
    except DnevnikAccount.DoesNotExist:
        return Response({'connected': False})


@api_view(['DELETE'])
def dnevnik_disconnect(request):
    """Отключить аккаунт дневник.ру"""
    DnevnikAccount.objects.filter(user=request.user).delete()
    return Response({'message': 'Аккаунт отключён'})