from django.db import models
from django.conf import settings

class DnevnikAccount(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dnevnik_account'
    )
    access_token = models.TextField()
    person_id = models.CharField(max_length=100, blank=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_sync = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Дневник.ру — {self.user.username}"