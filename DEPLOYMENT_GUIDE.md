# Tena Chatbot Backend Deployment Guide

This guide will help you deploy the Django backend with Telegram bot functionality to make your chatbot work when users say "/start".

## 🚀 Quick Deployment Steps

### 1. Get Telegram Bot Token

1. Open Telegram and search for **@BotFather**
2. Send `/start` to BotFather
3. Send `/newbot` to create a new bot
4. Follow the prompts:
   - Bot name: `Tena Wellness Bot`
   - Bot username: `tena_wellness_bot` (or your choice)
5. BotFather will give you a **token** like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
6. **Save this token** - you'll need it for deployment

### 2. Prepare Backend for Deployment

#### Create Environment File
In the `backend` directory, create a `.env` file:

```bash
cd backend
touch .env
```

Add these contents to `.env`:

```env
# Django Configuration
DJANGO_SECRET_KEY=your-unique-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-render-domain.onrender.com

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=tena_wellness_bot

# App Configuration
MINI_APP_URL=https://tena-app.netlify.app
GEMINI_API_KEY=your-gemini-api-key-here

# Development (keep true for now)
ALLOW_DEV_AUTH=true
```

#### Generate Django Secret Key
Run this command to generate a secure secret key:

```bash
python -c "import secrets; print('DJANGO_SECRET_KEY=' + secrets.token_urlsafe(50))"
```

Replace `your-unique-secret-key-here` with the generated key.

### 3. Deploy to Render (Recommended)

#### Step 3.1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)

#### Step 3.2: Connect GitHub Repository
1. Click "New" → "Web Service"
2. Connect your GitHub account
3. Select the `hackaton` repository
4. Choose the `backend` directory as root

#### Step 3.3: Configure Render Service

**Basic Settings:**
- **Name**: `tena-backend`
- **Region**: Choose nearest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python manage.py migrate && python manage.py runserver 0.0.0.0:$PORT`

**Advanced Settings:**
- **Instance Type**: `Free` (to start)
- **Auto-Deploy**: ✅ Enable

#### Step 3.4: Add Environment Variables
In Render dashboard, add these environment variables:

```
DJANGO_SECRET_KEY=your-unique-secret-key-here
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-app-name.onrender.com
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_USERNAME=tena_wellness_bot
MINI_APP_URL=https://tena-app.netlify.app
GEMINI_API_KEY=your-gemini-api-key-here
ALLOW_DEV_AUTH=false
```

#### Step 3.5: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note your Render URL: `https://your-app-name.onrender.com`

### 4. Set Up Bot Webhook (Alternative to Polling)

After deployment, you have two options to run the bot:

#### Option A: Webhook (Recommended for Production)
1. Update your bot to use webhook:
   ```bash
   # In your deployed backend, run once:
   curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
     -d "url=https://your-app-name.onrender.com/api/telegram-webhook/"
   ```

#### Option B: Long Polling (Easier for testing)
1. SSH into your Render server or use Render's shell
2. Run the bot command:
   ```bash
   python manage.py runbot
   ```

### 5. Update Frontend API URL

In `frontend/.env`, update the API base URL:

```env
VITE_API_BASE=https://your-app-name.onrender.com/api
```

### 6. Test Your Bot

1. Go to Telegram and find your bot
2. Send `/start` - you should see:
   ```
   ሰላም 👋 I'm *Tena* — your wellness companion.

   • Tap *Open Tena* for the full app (chat, voice journal, dashboard).
   • Tap *Open in browser* to use the website version.
   • Use /check anytime for a quick mood check-in.
   • Use /week to see your last 7 days.
   ```
3. Try the mood check-in buttons
4. Test other commands: `/check`, `/week`

## 🔧 Alternative: Manual Deployment

If you prefer not to use Render, you can deploy manually:

### Using VPS (DigitalOcean, Vultr, etc.)

1. **Server Setup:**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv nginx postgresql postgresql-contrib
   ```

2. **App Setup:**
   ```bash
   git clone https://github.com/yourusername/hackaton.git
   cd hackaton/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Database Setup:**
   ```bash
   sudo -u postgres createdb tena_db
   sudo -u postgres createuser tena_user
   sudo -u postgres psql -c "ALTER USER tena_user PASSWORD 'yourpassword';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tena_db TO tena_user;"
   ```

4. **Configure and Run:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000
   python manage.py runbot
   ```

## 🐛 Troubleshooting

### Bot Not Responding to /start

1. **Check if bot is running:**
   ```bash
   python manage.py runbot
   ```

2. **Verify bot token:**
   ```bash
   curl -X GET https://api.telegram.org/bot<TOKEN>/getMe
   ```

3. **Check logs for errors:**
   - In Render: View logs in dashboard
   - Local: Check terminal output

### Frontend Can't Connect to Backend

1. **Verify CORS settings** in `settings.py`
2. **Check API URL** in frontend `.env`
3. **Ensure backend is running** and accessible

### Database Issues

1. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

2. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

## 📱 Bot Commands Reference

- `/start` - Welcome message with app links
- `/check` - Quick mood check-in
- `/week` - Show last 7 days mood chart
- Any text - Chat with AI assistant
- Voice messages - Voice note processing

## 🔐 Security Notes

1. **Never commit `.env` file** to Git
2. **Use strong secret keys**
3. **Set `DJANGO_DEBUG=False`** in production
4. **Use HTTPS URLs** for MINI_APP_URL
5. **Monitor bot logs** regularly

## 📞 Support

If you encounter issues:

1. **Check Render logs** in dashboard
2. **Verify environment variables** are set correctly
3. **Test bot token** with Telegram API
4. **Ensure frontend API URL** points to deployed backend

Your Tena chatbot should now be fully functional! 🎉
