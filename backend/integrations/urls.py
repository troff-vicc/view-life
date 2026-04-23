from django.urls import path
from . import views

urlpatterns = [
    path('dnevnik/connect/', views.dnevnik_connect, name='dnevnik-connect'),
    path('dnevnik/sync/', views.dnevnik_sync, name='dnevnik-sync'),
    path('dnevnik/status/', views.dnevnik_status, name='dnevnik-status'),
    path('dnevnik/disconnect/', views.dnevnik_disconnect, name='dnevnik-disconnect'),
]