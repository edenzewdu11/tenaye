from django.urls import path
from . import views

urlpatterns = [
    path("auth/register/", views.register),
    path("auth/login/", views.login),
    path("me/", views.me),
    path("chat/", views.chat),
    path("checkins/", views.checkins),
    path("dashboard/", views.dashboard),
    path("voice/", views.voice_journal),
    path("journals/", views.journals),
]
