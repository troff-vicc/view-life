from django.urls import path
from . import views

urlpatterns = [
    path('create-task/', views.ai_create_task, name='ai-create-task'),
    path('classify/', views.ai_classify_only, name='ai-classify'),
]