from django.urls import path
from . import views

urlpatterns = [
    path("me/", views.me),
    path("chat/", views.chat),
    path("checkins/", views.checkins),
    path("dashboard/", views.dashboard),
    path("voice/", views.voice_journal),
    path("journals/", views.journals),
    path("recommendations/", views.recommendations, name="recommendations"),
    path("explore/", views.explore, name="explore"),
]

