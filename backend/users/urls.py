from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.me, name='me'),
    path('link-child/', views.link_child, name='link_child'),
    path('my-child/', views.my_child, name='my_child'),
    path('link-teacher/', views.link_teacher, name='link_teacher'),
    path('my-students/', views.my_students, name='my_students'),
]