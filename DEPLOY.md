# Deploy Tena

This guide walks you through deploying the three pieces of Tena:
- **Frontend** → Vercel (React Mini App)
- **Backend API** → Render (Django REST)
- **Telegram bot** → Any host (you can even run it locally)

---

## 1️⃣ Frontend — Vercel

1. **Push the repo** (already done)  
   ```bash
   git add -A && git commit -m "add vercel config" && git push
   ```

2. **Connect to Vercel**
   - Open https://vercel.com/new
   - Import the GitHub repo: `edenzewdu11/tenaye`
   - Root directory: `frontend`
   - Framework preset: **Vite** (auto-detected)
   - Environment Variables (under **Environment Variables**):
     - `VITE_API_BASE` → `https://tena-api.onrender.com/api` **(replace once you have the Render URL)**
   - Click **Deploy**.

3. **After first deploy**
   - Vercel gives you a URL like `https://tena-xyz.vercel.app`
   - Copy that URL → you’ll use it for the backend’s `FRONTEND_ORIGIN` and the bot’s `MINI_APP_URL`.

---

## 2️⃣ Backend — Render

1. **Push the repo** (already done)

2. **Create a new Web Service**
   - Open https://dashboard.render.com/new-web-service
   - Connect the GitHub repo: `edenzewdu11/tenaye`
   - Root directory: `backend`
   - Runtime: **Python 3**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn core.wsgi:application`

3. **Environment Variables** (under **Environment**)
   - `DATABASE_URL` → your Neon connection string  
     `postgresql://neondb_owner:npg_iT0O2seQmZqX@ep-plain-truth-aqwvfprp-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
   - `DJANGO_SETTINGS_MODULE` → `core.settings`
   - `DJANGO_DEBUG` → `false`
   - `DJANGO_ALLOWED_HOSTS` → `.onrender.com`
   - `TELEGRAM_BOT_TOKEN` → `8219870105:AAHGiy0tMyrAD16iK_Va3jKwekznzAV43bw`
   - `TELEGRAM_BOT_USERNAME` → `TenawellnessBot`
   - `MINI_APP_URL` → `https://tena-xyz.vercel.app` **(replace with your Vercel URL)**
   - `GEMINI_API_KEY` → `AIzaSyA_B62fpN6fiOEM0SZJIq1JHp84V73twWg`
   - `FRONTEND_ORIGIN` → `https://tena-xyz.vercel.app` **(replace with your Vercel URL)**

4. **Deploy**
   - Click **Create Web Service**. Render builds and runs Django.
   - Once live, you’ll get a URL like `https://tena-api.onrender.com`.

5. **Run migrations** (one‑time after first deploy)
   - In Render → **Shell** → run:
     ```bash
     python manage.py migrate
     ```

---

## 3️⃣ Telegram Bot — No deploy needed

The bot is a long‑polling script (`python manage.py runbot`). You can run it anywhere:

- **Locally** (your laptop, while you demo)
- **Cloud VM** (any cheap VPS)
- **Render** (as a background worker)

### Option A: Run locally (quick for demo)

```powershell
cd backend
python manage.py runbot
```
Keep it running while you demo.

### Option B: Run on Render (always‑on)

1. In Render → **New Blueprint** → select the repo.
2. Choose **Background Worker**.
3. Runtime: **Python 3**
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `python manage.py runbot`
6. Add the same env vars as step 2 (especially `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, `GEMINI_API_KEY`).
7. Deploy.

### Option C: Run on any VPS (e.g. DigitalOcean, EC2)

```bash
# On the server
git clone https://github.com/edenzewdu11/tenaye.git
cd tenaye/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Copy .env with your secrets
python manage.py migrate
# Run in a screen/tmux session
screen -S tenabot
python manage.py runbot
```

---

## 4️⃣ Wire the Mini App button

1. **Update BotFather menu button**
   - Open @BotFather → `/setmenubutton`
   - Choose your bot `@TenawellnessBot`
   - Set `Mini App URL` → your Vercel URL (`https://tena-xyz.vercel.app`)

2. **Update bot code (already done)**
   - The bot now shows the **Open Tena** button only when `MINI_APP_URL` is HTTPS. After you set the env var on Render, restart the bot so it picks up the HTTPS URL.

---

## 5️⃣ Verify the full flow

1. **Open @TenawellnessBot** → `/start` → you should see the **Open Tena** button.
2. Tap **Open Tena** → the Mini App opens inside Telegram.
3. Log a mood, chat, voice‑journal → data saves to Neon.
4. In the bot, try `/week` → you’ll see the same 7‑day chart.

---

## 6️⃣ Post‑hackaton housekeeping

- **Rotate secrets** (Neon password, Telegram token, Gemini key)
- **Delete Render worker** if you no longer want the bot running
- **Delete Vercel/Render services** if you want to tear down the demo

---

## Quick checklist

| ✅ | Item |
|---|---|
| ✅ Repo pushed to GitHub |
| ✅ Vercel config (`frontend/vercel.json`) |
| ✅ Render config (`backend/render.yaml`) |
| ✅ Set `VITE_API_BASE` on Vercel |
| ✅ Set env vars on Render (DB, bot token, Gemini, MINI_APP_URL, FRONTEND_ORIGIN) |
| ✅ Run migrations once on Render |
| ✅ Deploy bot (local or Render) |
| ✅ Set BotFather Mini App URL to Vercel URL |

If any step fails or you need a URL, paste me the error and I’ll help you debug. Happy deploying! 🚀
