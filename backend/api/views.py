from datetime import timedelta
from collections import OrderedDict

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .permissions import IsWebOrAuthenticated

import json
import logging
from .models import CheckIn, ChatMessage, JournalEntry, LocationRecommendation
from .serializers import (
    CheckInSerializer,
    ChatMessageSerializer,
    JournalEntrySerializer,
    TgUserSerializer,
    LocationRecommendationSerializer,
)
from .crisis import is_crisis, CRISIS_RESPONSE
from .gemini import chat_reply, transcribe_and_analyze, explore_places

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([])
def telegram_webhook(request):
    """
    Handle Telegram bot webhook updates
    """
    try:
        # Get update data from Telegram
        update_data = request.data
        
        # Log the update for debugging
        logger.info(f"Received Telegram update: {update_data}")
        
        # Handle different types of updates
        if 'message' in update_data:
            message = update_data['message']
            chat_id = message['chat']['id']
            
            # Handle /start command
            if message.get('text') == '/start':
                try:
                    from telegram import Bot
                    bot = Bot(token='8219870105:AAHGiy0tMyrAD16iK_Va3jKwekznzAV43bw')
                    
                    # Send welcome message
                    welcome_text = (
                        "ሰላም 👋 I'm *Tena* — your wellness companion.\n\n"
                        "• Tap *Open Tena* for the full app (chat, voice journal, dashboard).\n"
                        "• Tap *Open in browser* to use the website version.\n"
                        "• Use /check anytime for a quick mood check-in.\n"
                        "• Use /week to see your last 7 days."
                    )
                    
                    bot.send_message(chat_id=chat_id, text=welcome_text, parse_mode='Markdown')
                    
                    # Send check-in prompt
                    bot.send_message(
                        chat_id=chat_id, 
                        text="How is your energy today?",
                        reply_markup={
                            'inline_keyboard': [
                                [
                                    {'text': '🟢 Good', 'callback_data': 'ci:good'},
                                    {'text': '🟡 Surviving', 'callback_data': 'ci:surviving'},
                                    {'text': '🔴 Burned Out', 'callback_data': 'ci:burned'}
                                ],
                                [
                                    {'text': '📊 Show my week', 'callback_data': 'show:week'}
                                ]
                            ]
                        }
                    )
                except Exception as e:
                    logger.error(f"Error sending Telegram message: {str(e)}")
        
        elif 'callback_query' in update_data:
            # Handle button clicks
            callback_query = update_data['callback_query']
            chat_id = callback_query['message']['chat']['id']
            callback_data = callback_query['data']
            
            try:
                from telegram import Bot
                bot = Bot(token='8219870105:AAHGiy0tMyrAD16iK_Va3jKwekznzAV43bw')
                
                if callback_data.startswith('ci:'):
                    mood = callback_data.split(':')[1]
                    mood_messages = {
                        'good': "Love that 🟢. Hold onto whatever's working today.",
                        'surviving': "🟡 Surviving counts. Be gentle with yourself today.",
                        'burned': "🔴 Heard. Open Tena and let's talk for a minute."
                    }
                    
                    bot.edit_message_text(
                        chat_id=chat_id,
                        message_id=callback_query['message']['message_id'],
                        text=mood_messages.get(mood, "Thanks for checking in!")
                    )
            except Exception as e:
                logger.error(f"Error handling callback query: {str(e)}")
        
        return Response({'status': 'ok'}, status=200)
        
    except Exception as e:
        logger.error(f"Error in telegram webhook: {str(e)}")
        return Response({'status': 'ok'}, status=200)  # Always return 200 to Telegram


def parse_and_save_recommendations(user, text):
    """
    Looks for the [RECOMMENDATIONS] block in the reply.
    Saves recommendations to the database.
    Returns:
        clean_text (str): The text without the [RECOMMENDATIONS] block.
        has_new (bool): Whether new recommendations were saved.
    """
    if "[RECOMMENDATIONS]" not in text:
        return text, False

    parts = text.split("[RECOMMENDATIONS]")
    clean_text = parts[0].strip()
    recs_json_str = parts[1].strip()

    # Strip markdown block ticks if the model wrapped it
    if recs_json_str.startswith("```"):
        recs_json_str = recs_json_str.strip("`")
        if recs_json_str.lower().startswith("json"):
            recs_json_str = recs_json_str[4:].strip()

    has_new = False
    try:
        recs = json.loads(recs_json_str)
        if isinstance(recs, list):
            for r in recs:
                name = r.get("name")
                if name:
                    obj, created = LocationRecommendation.objects.update_or_create(
                        user=user,
                        name=name,
                        defaults={
                            "category": r.get("category", "Place"),
                            "description": r.get("description", ""),
                            "reason": r.get("reason", ""),
                        }
                    )
                    if created:
                        has_new = True
    except Exception as e:
        logger.exception("Failed to parse recommendations JSON: %s", e)

    return clean_text, has_new



@api_view(["GET", "POST"])
@permission_classes([IsWebOrAuthenticated])
def me(request):
    from .user_utils import get_web_user
    
    user = get_web_user(request)
    
    if request.method == 'POST':
        return Response(TgUserSerializer(user).data)
    
    return Response(TgUserSerializer(user).data)


# -------- Chat --------
@api_view(["GET", "POST"])
@parser_classes([JSONParser])
@permission_classes([IsWebOrAuthenticated])
def chat(request):
    from .user_utils import get_web_user
    
    user = get_web_user(request)
    if request.method == "GET":
        msgs = ChatMessage.objects.filter(user=user, source='web')[:200]
        return Response(ChatMessageSerializer(msgs, many=True).data)

    content = (request.data.get("content") or "").strip()
    if not content:
        return Response({"error": "content required"}, status=400)

    # Crisis tripwire
    if is_crisis(content):
        ChatMessage.objects.create(user=user, role="user", content=content, crisis_flag=True, source='web')
        ChatMessage.objects.create(
            user=user, role="assistant",
            content=CRISIS_RESPONSE["message"], crisis_flag=True, source='web',
        )
        return Response({
            "crisis": True,
            "reply": CRISIS_RESPONSE["message"],
            "resources": CRISIS_RESPONSE["resources"],
        })

    # Build history - only web messages
    history = [
        {"role": m.role, "content": m.content}
        for m in ChatMessage.objects.filter(user=user, source='web').order_by("created_at")[:40]
    ]
    user_msg = ChatMessage.objects.create(user=user, role="user", content=content, source='web')
    reply = chat_reply(history, content)
    
    if "CRISIS_TRIGGERED" in reply:
        user_msg.crisis_flag = True
        user_msg.save()
        ChatMessage.objects.create(
            user=user, role="assistant",
            content=CRISIS_RESPONSE["message"], crisis_flag=True, source='web',
        )
        return Response({
            "crisis": True,
            "reply": CRISIS_RESPONSE["message"],
            "resources": CRISIS_RESPONSE["resources"],
        })

    clean_reply, has_new_recs = parse_and_save_recommendations(user, reply)
    ChatMessage.objects.create(user=user, role="assistant", content=clean_reply, source='web')

    return Response({
        "crisis": False,
        "reply": clean_reply,
        "has_new_recommendations": has_new_recs,
    })


# -------- Check-ins --------
@api_view(["GET", "POST"])
@parser_classes([JSONParser])
@permission_classes([IsWebOrAuthenticated])
def checkins(request):
    user = request.user
    if request.method == "POST":
        mood = request.data.get("mood")
        note = request.data.get("note", "")
        if mood not in dict(CheckIn.MOOD_CHOICES):
            return Response({"error": "invalid mood"}, status=400)
        ci = CheckIn.objects.create(user=user, mood=mood, note=note)
        return Response(CheckInSerializer(ci).data, status=201)

    qs = CheckIn.objects.filter(user=user)[:60]
    return Response(CheckInSerializer(qs, many=True).data)


# -------- Weekly dashboard --------
@api_view(["GET"])
@permission_classes([IsWebOrAuthenticated])
def dashboard(request):
    user = request.user
    today = timezone.localdate()
    start = today - timedelta(days=6)
    qs = CheckIn.objects.filter(user=user, created_at__date__gte=start)

    # Aggregate latest check-in per day -> score
    by_day = OrderedDict()
    for i in range(7):
        d = start + timedelta(days=i)
        by_day[d.isoformat()] = None

    for ci in qs.order_by("created_at"):
        d = ci.created_at.astimezone(timezone.get_current_timezone()).date().isoformat()
        if d in by_day:
            by_day[d] = {
                "mood": ci.mood,
                "score": CheckIn.SCORE_MAP[ci.mood],
            }

    series = [{"date": d, **(v or {"mood": None, "score": None})} for d, v in by_day.items()]
    scored = [s["score"] for s in series if s["score"] is not None]
    avg = round(sum(scored) / len(scored), 2) if scored else None
    streak = 0
    for s in reversed(series):
        if s["score"] is not None:
            streak += 1
        else:
            break

    return Response({
        "series": series,
        "average": avg,
        "streak_days": streak,
        "total_checkins": len(scored),
    })


# -------- Voice journal --------
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsWebOrAuthenticated])
def voice_journal(request):
    user = request.user
    audio = request.FILES.get("audio")
    if not audio:
        return Response({"error": "audio file required (multipart field 'audio')"}, status=400)
    mime = audio.content_type or "audio/webm"
    data = transcribe_and_analyze(audio.read(), mime_type=mime)

    transcript = data.get("transcript", "")
    crisis = is_crisis(transcript)

    entry = JournalEntry.objects.create(
        user=user,
        transcript=transcript,
        sentiment=data.get("sentiment", ""),
        summary=data.get("summary", ""),
    )

    if crisis:
        ChatMessage.objects.create(user=user, role="user", content=transcript, is_voice=True, crisis_flag=True, source='web')
        ChatMessage.objects.create(
            user=user, role="assistant",
            content=CRISIS_RESPONSE["message"], crisis_flag=True, source='web',
        )
        return Response({
            "entry": JournalEntrySerializer(entry).data,
            "reply": CRISIS_RESPONSE["message"],
            "crisis": True,
            "resources": CRISIS_RESPONSE["resources"],
        })

    reply = data.get("reply", "")
    clean_reply = reply
    has_new_recs = False
    ChatMessage.objects.create(user=user, role="user", content=transcript, is_voice=True, source='web')
    if reply:
        clean_reply, has_new_recs = parse_and_save_recommendations(user, reply)
        ChatMessage.objects.create(user=user, role="assistant", content=clean_reply, source='web')

    return Response({
        "entry": JournalEntrySerializer(entry).data,
        "reply": clean_reply,
        "crisis": False,
        "has_new_recommendations": has_new_recs,
    })


@api_view(["GET"])
def journals(request):
    qs = JournalEntry.objects.filter(user=request.user)[:60]
    return Response(JournalEntrySerializer(qs, many=True).data)



@api_view(["GET"])
def recommendations(request):
    qs = LocationRecommendation.objects.filter(user=request.user)
    return Response(LocationRecommendationSerializer(qs, many=True).data)


@api_view(["POST"])
@parser_classes([JSONParser])
def explore(request):
    """Given a user's mood/interest query, return AI-suggested nearby places."""
    query = (request.data.get("query") or "").strip()
    if not query:
        return Response({"error": "query required"}, status=400)
    data = explore_places(query)
    return Response(data)
