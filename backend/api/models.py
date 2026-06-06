from django.db import models
from django.contrib.auth.hashers import make_password, check_password as django_check_password
import secrets


class AppUser(models.Model):
    """Email/password registered users."""
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=256)
    name = models.CharField(max_length=128, blank=True, default="")
    token = models.CharField(max_length=64, unique=True, blank=True)
    interests = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    is_authenticated = True
    is_anonymous = False

    def set_password(self, raw):
        self.password_hash = make_password(raw)

    def check_password(self, raw):
        return django_check_password(raw, self.password_hash)

    def rotate_token(self):
        self.token = secrets.token_urlsafe(32)

    def save(self, *args, **kwargs):
        if not self.token:
            self.rotate_token()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class GuestUser:
    """Ephemeral unauthenticated user — identified by a UUID from the client."""
    is_authenticated = False
    is_anonymous = True

    def __init__(self, guest_id: str):
        self.guest_id = guest_id
        self.first_name = "Guest"
        self.telegram_id = None

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
    TELEGRAM, WEB = "telegram", "web"
    SOURCE_CHOICES = [(TELEGRAM, "Telegram"), (WEB, "Web")]

    user = models.ForeignKey(TgUser, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    content = models.TextField()
    source = models.CharField(max_length=16, choices=SOURCE_CHOICES, default=WEB)
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
