"""
Authenticates Telegram Mini App requests.

Telegram WebApp sends an `initData` string (URL-encoded). We verify the HMAC
signature against the bot token and extract the user. We accept it via the
`Authorization: tma <initData>` header OR `X-Telegram-Init-Data` header.

In DEBUG (`ALLOW_DEV_AUTH=True`) we also accept `X-Telegram-Id: <id>` so the
frontend can be tested in a normal browser without Telegram.
"""
import hmac
import hashlib
import json
import time
from urllib.parse import parse_qsl

from django.conf import settings
from rest_framework import authentication, exceptions

from .models import TgUser


def _verify_init_data(init_data: str, bot_token: str, max_age_seconds: int = 60 * 60 * 24):
    """Validate Telegram WebApp initData. Returns parsed dict or raises."""
    if not init_data or not bot_token:
        raise exceptions.AuthenticationFailed("Missing initData or bot token")

    parsed = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise exceptions.AuthenticationFailed("No hash in initData")

    data_check_string = "\n".join(f"{k}={parsed[k]}" for k in sorted(parsed.keys()))
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    calc_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calc_hash, received_hash):
        raise exceptions.AuthenticationFailed("Bad initData signature")

    auth_date = int(parsed.get("auth_date", "0"))
    if auth_date and (time.time() - auth_date) > max_age_seconds:
        raise exceptions.AuthenticationFailed("initData expired")

    return parsed


class TelegramAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        init_data = request.META.get("HTTP_X_TELEGRAM_INIT_DATA", "")
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not init_data and auth_header.lower().startswith("tma "):
            init_data = auth_header[4:].strip()

        if init_data:
            parsed = _verify_init_data(init_data, settings.TELEGRAM_BOT_TOKEN)
            user_json = parsed.get("user", "{}")
            try:
                u = json.loads(user_json)
            except json.JSONDecodeError:
                raise exceptions.AuthenticationFailed("Bad user payload")
            user = _get_or_create_user(u)
            return (user, None)

        # Dev fallback
        if settings.ALLOW_DEV_AUTH:
            dev_id = request.META.get("HTTP_X_TELEGRAM_ID")
            if dev_id:
                user = _get_or_create_user({
                    "id": int(dev_id),
                    "first_name": request.META.get("HTTP_X_TELEGRAM_NAME", "Dev User"),
                    "username": "dev",
                    "language_code": "en",
                })
                return (user, None)

        return None  # let DRF return 401


def _get_or_create_user(u: dict) -> TgUser:
    tg_id = int(u.get("id"))
    defaults = {
        "username": u.get("username", "") or "",
        "first_name": u.get("first_name", "") or "",
        "last_name": u.get("last_name", "") or "",
        "language_code": u.get("language_code", "en") or "en",
    }
    user, created = TgUser.objects.get_or_create(telegram_id=tg_id, defaults=defaults)
    if not created:
        changed = False
        for k, v in defaults.items():
            if v and getattr(user, k) != v:
                setattr(user, k, v)
                changed = True
        if changed:
            user.save()
    return user
