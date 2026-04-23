from django.db import models
from django.conf import settings


class AIConversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_conversations'
    )

    messages = models.JSONField(default=list)
    
    task = models.ForeignKey(
        'tasks.Task',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='conversation'
    )
    
    is_complete = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Диалог {self.user.username} — {self.created_at:%d.%m %H:%M}"