from django.contrib import admin
from .models import TgUser, CheckIn, ChatMessage, JournalEntry

admin.site.register(TgUser)
admin.site.register(CheckIn)
admin.site.register(ChatMessage)
admin.site.register(JournalEntry)
