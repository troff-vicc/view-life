from django.urls import path
from . import views

urlpatterns = [
    path('', views.task_list, name='task-list'),
    path('create/', views.task_create, name='task-create'),
    path('<int:pk>/', views.task_detail, name='task-detail'),
    path('<int:pk>/status/', views.task_status, name='task-status'),
    path('<int:task_pk>/steps/', views.task_steps, name='task-steps'),
    path('steps/<int:pk>/', views.step_detail, name='step-detail'),
    path('<int:task_pk>/steps/', views.step_create, name='step-create'),
]