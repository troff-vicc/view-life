from django.db import models
from django.conf import settings


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Низкий'),
        ('medium', 'Средний'),
        ('high', 'Высокий'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Не начато'),
        ('in_progress', 'В процессе'),
        ('done', 'Выполнено'),
    ]
    TASK_TYPE_CHOICES = [
        ('homework', 'Домашнее задание'),
        ('project', 'Проект'),
        ('exam', 'Контрольная/Экзамен'),
        ('personal', 'Личная задача'),
        ('other', 'Другое'),
    ]

    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    deadline = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    task_type = models.CharField(max_length=20, choices=TASK_TYPE_CHOICES, default='other')

    raw_input = models.TextField(blank=True)
    ai_generated = models.BooleanField(default=False)

    recommended_start = models.DateTimeField(null=True, blank=True)
    estimated_minutes = models.IntegerField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='created_tasks'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='assigned_tasks', null=True, blank=True
    )

    missed_reminders = models.IntegerField(default=0)
    points_awarded = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TaskStep(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='steps')
    title = models.CharField(max_length=255)
    is_done = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.task.title} — шаг {self.order}"

