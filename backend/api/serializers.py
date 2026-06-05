from rest_framework import serializers
from .models import CheckIn, ChatMessage, JournalEntry, TgUser


class TgUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = TgUser
        fields = ["telegram_id", "username", "first_name", "last_name", "language_code"]


class CheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = ["id", "mood", "note", "created_at"]
        read_only_fields = ["id", "created_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "role", "content", "is_voice", "crisis_flag", "created_at"]
        read_only_fields = fields


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ["id", "transcript", "sentiment", "summary", "created_at"]
        read_only_fields = fields
