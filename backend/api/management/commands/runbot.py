"""
Run the Tena Telegram bot.

Usage:
    python manage.py runbot

Features:
  /start  -> launch Mini App + intro
  /check  -> daily check-in inline buttons (🟢 🟡 🔴)
  /week   -> ASCII bar chart of last 7 days
  daily 18:00 Africa/Addis_Ababa job sending check-in to all users
"""
import asyncio
from datetime import time as dtime, timedelta

from asgiref.sync import sync_to_async
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    WebAppInfo,
)
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

from api.models import TgUser, CheckIn, ChatMessage
from api.gemini import chat_reply
from api.crisis import is_crisis, CRISIS_RESPONSE


def _kb_checkin():
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("🟢 Good", callback_data="ci:good"),
        InlineKeyboardButton("🟡 Surviving", callback_data="ci:surviving"),
        InlineKeyboardButton("🔴 Burned Out", callback_data="ci:burned"),
    ], [
        InlineKeyboardButton("📊 Show my week", callback_data="show:week"),
    ]])


def _kb_open_app():
    # Telegram requires HTTPS for both `web_app` and URL inline buttons.
    # If we don't have HTTPS yet (local dev), return None so the caller sends no markup.
    url = settings.MINI_APP_URL or ""
    if not url.startswith("https://"):
        return None
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("💬 Open Tena", web_app=WebAppInfo(url=url)),
        InlineKeyboardButton("🌐 Open in browser", url=url),
    ]])


@sync_to_async
def _upsert_user(tg_user) -> TgUser:
    user, _ = TgUser.objects.get_or_create(
        telegram_id=tg_user.id,
        defaults={
            "username": tg_user.username or "",
            "first_name": tg_user.first_name or "",
            "last_name": tg_user.last_name or "",
            "language_code": tg_user.language_code or "en",
        },
    )
    return user


@sync_to_async
def _save_checkin(tg_id: int, mood: str):
    user = TgUser.objects.get(telegram_id=tg_id)
    CheckIn.objects.create(user=user, mood=mood)


@sync_to_async
def _week_series(tg_id: int):
    user = TgUser.objects.get(telegram_id=tg_id)
    today = timezone.localdate()
    start = today - timedelta(days=6)
    qs = CheckIn.objects.filter(user=user, created_at__date__gte=start).order_by("created_at")
    by_day = {}
    for i in range(7):
        d = start + timedelta(days=i)
        by_day[d] = None
    for ci in qs:
        d = ci.created_at.astimezone(timezone.get_current_timezone()).date()
        by_day[d] = ci.mood
    return [(d, m) for d, m in by_day.items()]


@sync_to_async
def _all_user_ids():
    return list(TgUser.objects.values_list("telegram_id", flat=True))


def _bar(mood):
    return {
        "good": "🟢🟢🟢",
        "surviving": "🟡🟡",
        "burned": "🔴",
        None: "·",
    }[mood]


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _upsert_user(update.effective_user)
    text = (
        "ሰላም 👋 I'm *Tena* — your wellness companion.\n\n"
        "• Tap *Open Tena* for the full app (chat, voice journal, dashboard).\n"
        "• Tap *Open in browser* to use the website version.\n"
        "• Use /check anytime for a quick mood check-in.\n"
        "• Use /week to see your last 7 days."
    )
    await update.message.reply_markdown(text, reply_markup=_kb_open_app())
    await update.message.reply_text("How is your energy today?", reply_markup=_kb_checkin())


async def cmd_check(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _upsert_user(update.effective_user)
    await update.message.reply_text("How is your energy today?", reply_markup=_kb_checkin())


async def cmd_week(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await _upsert_user(update.effective_user)
    series = await _week_series(update.effective_user.id)
    lines = ["*Your last 7 days*"]
    for d, m in series:
        lines.append(f"`{d.strftime('%a %d')}`  {_bar(m)}")
    await update.message.reply_markdown("\n".join(lines), reply_markup=_kb_open_app())


@sync_to_async
def _chat_with_ai(tg_user, text: str):
    """Persist user msg, run crisis check or Gemini, persist & return assistant reply."""
    user, _ = TgUser.objects.get_or_create(
        telegram_id=tg_user.id,
        defaults={
            "username": tg_user.username or "",
            "first_name": tg_user.first_name or "",
            "last_name": tg_user.last_name or "",
            "language_code": tg_user.language_code or "en",
        },
    )
    if is_crisis(text):
        ChatMessage.objects.create(user=user, role="user", content=text, crisis_flag=True)
        ChatMessage.objects.create(user=user, role="assistant",
                                   content=CRISIS_RESPONSE["message"], crisis_flag=True)
        return True, CRISIS_RESPONSE["message"], CRISIS_RESPONSE["resources"]

    # Only get Telegram messages, not web messages
    history = [{"role": m.role, "content": m.content}
               for m in ChatMessage.objects.filter(user=user, source='telegram').order_by("created_at")[:40]]
    ChatMessage.objects.create(user=user, role="user", content=text, source='telegram')
    reply = chat_reply(history, text)
    ChatMessage.objects.create(user=user, role="assistant", content=reply, source='telegram')
    return False, reply, []


async def on_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.text:
        return
    await msg.chat.send_action("typing")
    
    # Check for hobby-related requests
    text_lower = msg.text.lower()
    if any(word in text_lower for word in ['hobby', 'hobbies', 'interest', 'fun', 'activity', 'recommend']):
        reply = await _get_hobby_recommendations(msg.text)
        await msg.reply_text(reply, reply_markup=_kb_browser_button())
        return
    
    crisis, reply, resources = await _chat_with_ai(msg.from_user, msg.text)
    await msg.reply_text(reply, reply_markup=_kb_browser_button())
    if crisis and resources:
        lines = ["*Right now, please reach out:*"]
        for r in resources:
            line = f"• *{r['name']}*"
            if r.get("phone"):
                line += f" — `{r['phone']}`"
            lines.append(line)
            if r.get("address"):
                lines.append(f"  _{r['address']}_")
        await msg.reply_markdown("\n".join(lines))


async def on_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.voice:
        return
    await msg.chat.send_action("typing")
    
    try:
        # Download voice file
        voice_file = await msg.voice.get_file()
        voice_bytes = await voice_file.download_as_bytearray()
        
        # Transcribe using Gemini (you'd need to implement this)
        # For now, we'll use a placeholder
        transcription = "Voice message received. I'm working on voice transcription!"
        
        await msg.reply_text(f"🎤 Voice: {transcription}", reply_markup=_kb_browser_button())
    except Exception as e:
        await msg.reply_text("Sorry, I couldn't process your voice message. Try typing instead!")


@sync_to_async
def _get_hobby_recommendations(text: str) -> str:
    """Get hobby recommendations based on user input"""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['stress', 'anxious', 'overwhelmed']):
        return """🧘‍♀️ *Relaxing hobbies for stress relief:*
• Yoga & meditation
• Painting or drawing
• Gardening
• Listening to calming music
• Reading fiction
• Walking in nature

Try one for 15 minutes today!"""
    
    elif any(word in text_lower for word in ['creative', 'art', 'make']):
        return """🎨 *Creative hobby ideas:*
• Sketching or painting
• Photography
• Writing stories or poetry
• DIY crafts
• Playing an instrument
• Cooking new recipes

What sounds most exciting to you?"""
    
    elif any(word in text_lower for word in ['active', 'sport', 'move']):
        return """🏃‍♂️ *Active hobby suggestions:*
• Running or jogging
• Dancing
• Swimming
• Cycling
• Team sports
• Hiking

What's your fitness level like?"""
    
    else:
        return """🌟 *General hobby recommendations:*
• Learning a new language
• Photography
• Coding/programming
• Playing board games
• Bird watching
• Knitting or crochet
• Chess
• Blogging

What kind of activities interest you most?"""


def _kb_browser_button():
    """Return keyboard with 'Open in browser' button"""
    web_app_url = getattr(settings, 'MINI_APP_URL', 'http://localhost:5175')
    if web_app_url.startswith('https://'):
        return InlineKeyboardMarkup([[
            InlineKeyboardButton("🌐 Open in browser", web_app=WebAppInfo(url=web_app_url))
        ]])
    return None


async def on_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    data = q.data or ""
    if data.startswith("ci:"):
        mood = data.split(":", 1)[1]
        await _upsert_user(q.from_user)
        await _save_checkin(q.from_user.id, mood)
        msg = {
            "good": "Love that 🟢. Hold onto whatever's working today.",
            "surviving": "🟡 Surviving counts. Be gentle with yourself today.",
            "burned": "🔴 Heard. Open Tena and let's talk for a minute.",
        }[mood]
        await q.edit_message_text(msg, reply_markup=_kb_open_app())
    elif data == "show:week":
        series = await _week_series(q.from_user.id)
        lines = ["*Your last 7 days*"]
        for d, m in series:
            lines.append(f"`{d.strftime('%a %d')}`  {_bar(m)}")
        await q.message.reply_markdown("\n".join(lines), reply_markup=_kb_open_app())


async def daily_checkin_job(context: ContextTypes.DEFAULT_TYPE):
    ids = await _all_user_ids()
    for tg_id in ids:
        try:
            await context.bot.send_message(
                chat_id=tg_id,
                text="🌙 Daily check-in: how is your energy today?",
                reply_markup=_kb_checkin(),
            )
        except Exception:
            continue


class Command(BaseCommand):
    help = "Run the Tena Telegram bot (long polling)."

    def handle(self, *args, **options):
        token = settings.TELEGRAM_BOT_TOKEN
        if not token:
            self.stderr.write("TELEGRAM_BOT_TOKEN missing in .env")
            return

        app = Application.builder().token(token).build()
        app.add_handler(CommandHandler("start", cmd_start))
        app.add_handler(CommandHandler("check", cmd_check))
        app.add_handler(CommandHandler("week", cmd_week))
        app.add_handler(CallbackQueryHandler(on_callback))
        app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))
        app.add_handler(MessageHandler(filters.VOICE, on_voice))

        # Daily 18:00 Africa/Addis_Ababa
        try:
            import pytz
            tz = pytz.timezone("Africa/Addis_Ababa")
            app.job_queue.run_daily(daily_checkin_job, time=dtime(hour=18, minute=0, tzinfo=tz))
        except Exception as e:
            self.stdout.write(f"(job_queue not scheduled: {e})")

        self.stdout.write(self.style.SUCCESS("Tena bot is running. Ctrl+C to stop."))
        app.run_polling(allowed_updates=Update.ALL_TYPES)
