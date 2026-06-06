from datetime import timedelta
from collections import OrderedDict

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from .models import CheckIn, ChatMessage, JournalEntry
from .serializers import (
    CheckInSerializer,
    ChatMessageSerializer,
    JournalEntrySerializer,
    TgUserSerializer,
)
from .crisis import is_crisis, CRISIS_RESPONSE
from .gemini import chat_reply, transcribe_and_analyze


@api_view(["GET"])
def me(request):
    return Response(TgUserSerializer(request.user).data)


# -------- Chat --------
@api_view(["GET", "POST"])
@parser_classes([JSONParser])
def chat(request):
    user = request.user
    if request.method == "GET":
        msgs = ChatMessage.objects.filter(user=user)[:200]
        return Response(ChatMessageSerializer(msgs, many=True).data)

    content = (request.data.get("content") or "").strip()
    if not content:
        return Response({"error": "content required"}, status=400)

    # Crisis tripwire
    if is_crisis(content):
        ChatMessage.objects.create(user=user, role="user", content=content, crisis_flag=True)
        ChatMessage.objects.create(
            user=user, role="assistant",
            content=CRISIS_RESPONSE["message"], crisis_flag=True,
        )
        return Response({
            "crisis": True,
            "reply": CRISIS_RESPONSE["message"],
            "resources": CRISIS_RESPONSE["resources"],
        })

    # Build history
    history = [
        {"role": m.role, "content": m.content}
        for m in ChatMessage.objects.filter(user=user).order_by("created_at")[:40]
    ]
    user_msg = ChatMessage.objects.create(user=user, role="user", content=content)
    reply = chat_reply(history, content)
    
    if "CRISIS_TRIGGERED" in reply:
        user_msg.crisis_flag = True
        user_msg.save()
        ChatMessage.objects.create(
            user=user, role="assistant",
            content=CRISIS_RESPONSE["message"], crisis_flag=True,
        )
        return Response({
            "crisis": True,
            "reply": CRISIS_RESPONSE["message"],
            "resources": CRISIS_RESPONSE["resources"],
        })

    ChatMessage.objects.create(user=user, role="assistant", content=reply)

    return Response({"crisis": False, "reply": reply})


# -------- Check-ins --------
@api_view(["GET", "POST"])
@parser_classes([JSONParser])
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
        ChatMessage.objects.create(user=user, role="user", content=transcript, is_voice=True, crisis_flag=True)
        ChatMessage.objects.create(
            user=user, role="assistant",
            content=CRISIS_RESPONSE["message"], crisis_flag=True,
        )
        return Response({
            "entry": JournalEntrySerializer(entry).data,
            "reply": CRISIS_RESPONSE["message"],
            "crisis": True,
            "resources": CRISIS_RESPONSE["resources"],
        })

    reply = data.get("reply", "")
    ChatMessage.objects.create(user=user, role="user", content=transcript, is_voice=True)
    if reply:
        ChatMessage.objects.create(user=user, role="assistant", content=reply)

    return Response({
        "entry": JournalEntrySerializer(entry).data,
        "reply": reply,
        "crisis": False,
    })


@api_view(["GET"])
def journals(request):
    qs = JournalEntry.objects.filter(user=request.user)[:60]
    return Response(JournalEntrySerializer(qs, many=True).data)
