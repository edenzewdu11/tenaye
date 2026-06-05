from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(_request):
    return JsonResponse({"status": "ok", "service": "tena-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("", health),
]
