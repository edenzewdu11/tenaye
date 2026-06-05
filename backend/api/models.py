from django.db import models


class TgUser(models.Model):
    telegram_id = models.BigIntegerField(unique=True, db_index=True)
    username = models.CharField(max_length=64, blank=True, default="")
    first_name = models.CharField(max_length=128, blank=True, default="")
    last_name = models.CharField(max_length=128, blank=True, default="")
    language_code = models.CharField(max_length=8, blank=True, default="en")
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    # Required by DRF auth contract
    is_authenticated = True
    is_anonymous = False

    def __str__(self):
        return f"{self.first_name} (@{self.username or self.telegram_id})"


class CheckIn(models.Model):
    GOOD, SURVIVING, BURNED = "good", "surviving", "burned"
    MOOD_CHOICES = [
        (GOOD, "Good"),
        (SURVIVING, "Surviving"),
        (BURNED, "Burned Out"),
    ]
    SCORE_MAP = {GOOD: 3, SURVIVING: 2, BURNED: 1}

    user = models.ForeignKey(TgUser, on_delete=models.CASCADE, related_name="checkins")
    mood = models.CharField(max_length=16, choices=MOOD_CHOICES)
    note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class ChatMessage(models.Model):
    USER, ASSISTANT = "user", "assistant"
    ROLE_CHOICES = [(USER, "User"), (ASSISTANT, "Assistant")]

    user = models.ForeignKey(TgUser, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    content = models.TextField()
    is_voice = models.BooleanField(default=False)
    crisis_flag = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class JournalEntry(models.Model):
    user = models.ForeignKey(TgUser, on_delete=models.CASCADE, related_name="journals")
    transcript = models.TextField()
    sentiment = models.CharField(max_length=32, blank=True, default="")
    summary = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
