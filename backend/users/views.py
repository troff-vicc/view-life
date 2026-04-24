from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer
from .models import User


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
def link_child(request):
    """Родитель привязывает аккаунт ребёнка по username"""
    if request.user.role != 'parent':
        return Response({'error': 'Только для родителей'}, status=403)

    username = request.data.get('username', '').strip()
    if not username:
        return Response({'error': 'Укажи username ребёнка'}, status=400)

    try:
        child = User.objects.get(username=username, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Ученик с таким username не найден'}, status=404)

    request.user.linked_student = child
    request.user.save()
    return Response({'ok': True, 'child_username': child.username})


@api_view(['GET'])
def my_child(request):
    """Данные привязанного ребёнка"""
    if request.user.role != 'parent':
        return Response({'error': 'Только для родителей'}, status=403)

    child = request.user.linked_student
    if not child:
        return Response({'linked': False})

    return Response({
        'linked': True,
        'id': child.id,
        'username': child.username,
    })