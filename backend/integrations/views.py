from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import DnevnikAccount
from .dnevnik import sync_homework_to_tasks


@api_view(['POST'])
def dnevnik_save_token(request):
    """
    Сохранить токен после OAuth2 авторизации
    Тело: {"token": "..."}
    """
    token = request.data.get('token', '').strip()
    if not token:
        return Response({'error': 'Токен не передан'}, status=status.HTTP_400_BAD_REQUEST)

    account, _ = DnevnikAccount.objects.update_or_create(
        user=request.user,
        defaults={
            'access_token': token,
            'person_id': '',
        }
    )
    return Response({
        'message': 'Аккаунт дневник.ру подключён',
        'connected_at': account.connected_at,
    })


@api_view(['POST'])
def dnevnik_sync(request):
    """Синхронизировать ДЗ из дневник.ру"""
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
        return Response(
            {'error': f'Ошибка синхронизации: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    account.last_sync = timezone.now()
    account.save()

    return Response({
        'message': 'Синхронизация завершена',
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