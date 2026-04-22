from django.urls import path
from . import views

urlpatterns = [
    path('', views.task_list, name='task-list'),
    path('create/', views.task_create, name='task-create'),
    path('<int:pk>/', views.task_detail, name='task-detail'),
    path('<int:pk>/status/', views.task_status, name='task-status'),
    path('steps/<int:pk>/toggle/', views.step_toggle, name='step-toggle'),
    path('<int:task_pk>/steps/', views.step_create, name='step-create'),
]