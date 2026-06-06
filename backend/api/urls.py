from django.urls import path
from . import views
from . import auth_views

urlpatterns = [
    # Auth endpoints
    path("auth/register/", auth_views.register),
    path("auth/login/", auth_views.login),
    path("auth/logout/", auth_views.logout),
    path("auth/profile/", auth_views.profile),
    
    # Existing endpoints
    path("me/", views.me),
    path("chat/", views.chat),
    path("checkins/", views.checkins),
    path("dashboard/", views.dashboard),
    path("voice/", views.voice_journal),
    path("journals/", views.journals),
]
