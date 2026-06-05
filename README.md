# Tena — ጤና

> A culturally-grounded mental wellness companion for Ethiopia.
> **Telegram Mini App** + **Telegram Bot** + **AI (Gemini 1.5 Flash)** + **Neon Postgres**.

Three hero features:

1. **AI chat with Amharic/English code-switching + voice journaling** (Gemini 1.5 Flash, audio in-browser via MediaRecorder, server-side transcription + sentiment).
2. **Frictionless stress tracking** — inline emoji check-ins inside Telegram chat *and* a 7-day visual dashboard in the Mini App.
3. **Crisis detection + local resource routing** — Ethiopian Mental Health Helpline (8149), St. Amanuel Hospital, emergency (991).

---

## Stack

- **Frontend**: React + Vite, Telegram Web App SDK, recharts. Runs as a Telegram Mini App (and in a regular browser for dev).
- **Backend**: Django 5 + Django REST Framework. Auth via Telegram `initData` HMAC (no passwords).
- **DB**: Neon serverless Postgres (falls back to SQLite if `DATABASE_URL` is empty).
- **AI**: Google Gemini 1.5 Flash (chat + audio understanding).
- **Bot**: `python-telegram-bot` (long polling, daily 18:00 Addis check-in job).

---

## 1. Backend setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env: set GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, DATABASE_URL (Neon), MINI_APP_URL
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Run the Telegram bot in a second terminal:

```powershell
cd backend
.venv\Scripts\Activate.ps1
python manage.py runbot
```

### Neon connection string

In your Neon dashboard, copy the **Pooled connection** string and paste into `DATABASE_URL`. It looks like:

```
postgres://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

---

## 2. Frontend setup

```powershell
cd frontend
npm install
copy .env.example .env
# Edit .env if your backend isn't at http://localhost:8000
npm run dev
```

Open http://localhost:5173 — it works in a normal browser using `X-Telegram-Id` dev auth (`ALLOW_DEV_AUTH` is on when `DJANGO_DEBUG=True`).

---

## 3. Wire up the Telegram Mini App

1. Talk to [@BotFather](https://t.me/BotFather):
   - `/newbot` → get `TELEGRAM_BOT_TOKEN`
   - `/setmenubutton` or `/newapp` → set the Mini App URL to your **HTTPS** frontend URL (Vercel/Netlify/Cloudflare Pages).
2. Put that URL in `backend/.env` as `MINI_APP_URL`.
3. Put your backend's public URL into `frontend/.env` as `VITE_API_BASE` (e.g. `https://api.yourdomain.com/api`).
4. Re-deploy frontend → re-run the bot.

### Local HTTPS for testing inside Telegram

Use `cloudflared tunnel --url http://localhost:5173` (or `ngrok http 5173`). Paste the HTTPS URL into BotFather and as `MINI_APP_URL`.

---

## 4. API surface

All endpoints require Telegram auth (`X-Telegram-Init-Data` header) or, in DEBUG, `X-Telegram-Id`.

| Method | Path              | Purpose                                            |
|-------:|-------------------|----------------------------------------------------|
| GET    | `/api/me/`        | Current Telegram user                              |
| GET    | `/api/chat/`      | Chat history                                       |
| POST   | `/api/chat/`      | `{ content }` → AI reply (or crisis payload)       |
| GET    | `/api/checkins/`  | Check-in history                                   |
| POST   | `/api/checkins/`  | `{ mood: good\|surviving\|burned, note }`          |
| GET    | `/api/dashboard/` | 7-day series + average + streak                    |
| POST   | `/api/voice/`     | `multipart/form-data` `audio` → transcript + reply |
| GET    | `/api/journals/`  | Voice journal history                              |

---

## 5. Demo script (90 seconds, jaw-drop edition)

1. **QR on the slide** → judge scans → Mini App opens *inside* their Telegram. No install.
2. **Tap 🟡 Surviving** — show the bar chart animate. (Hits *stress tracking*.)
3. **Tap Voice** → hold the button → say *"I'm so stressed about my MoE exam ena teff price'm wodaj honoal."*
   - Watch it transcribe Afranglish, label sentiment `stressed`, and reply in code-switch. (Hits *AI chatbot + localization*.)
4. **Tap Chat** → type *"I don't want to be here anymore."*
   - The crisis card appears with **8149**, St. Amanuel, **991**. (Hits *impact + safety net*.)
5. Back in the Telegram chat itself: `/check` → tap 🔴 → `/week` → ASCII chart. Show that the **same** check-ins live in both surfaces.

---

## 6. Project layout

```
backend/
  core/           # Django project (settings, urls, wsgi)
  api/
    models.py            # TgUser, CheckIn, ChatMessage, JournalEntry
    telegram_auth.py     # initData HMAC verification + dev fallback
    gemini.py            # Gemini 1.5 Flash wrapper + system prompt
    crisis.py            # Keyword tripwire + local resources
    views.py / urls.py
    management/commands/runbot.py   # python manage.py runbot
frontend/
  src/
    App.jsx, api.js, telegram.js, styles.css
    components/
      Chat.jsx, VoiceJournal.jsx, Dashboard.jsx, CheckIn.jsx, CrisisCard.jsx
```

---

## 7. Hackathon shortcuts already taken for you

- No custom auth — Telegram is the identity provider.
- No model training — Gemini handles chat *and* audio understanding in one call.
- No mobile build pipeline — Vite SPA hosted as a Mini App.
- No empty social feed — single-player experience between user and AI.
- Graceful degradation — if `GEMINI_API_KEY` is missing the app still runs with a local fallback so live demos never hard-crash.

Good luck. ጤና ይስጥልኝ. 💚
