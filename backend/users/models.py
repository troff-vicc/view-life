from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Ученик'),
        ('teacher', 'Учитель'),
        ('parent', 'Родитель'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    # Родитель привязан к ученику
    linked_student = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='parents'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"