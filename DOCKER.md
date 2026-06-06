# Docker Deployment Guide

This guide shows how to run Tena using Docker and Docker Compose.

## 🐳 Quick Start

### Development (Hot Reload)
```bash
# Start database + backend + frontend (development mode)
docker-compose -f docker-compose.dev.yml up --build

# Start with Telegram bot too
docker-compose -f docker-compose.dev.yml --profile bot up --build
```

### Production
```bash
# Start all services
docker-compose up --build -d

# Start with Telegram bot
docker-compose --profile bot up --build -d
```

## 📋 Services

### 🗄️ Database
- **PostgreSQL 15** on port `5432`
- Auto-creates database and user
- Data persists in `postgres_data` volume

### 🧠 Backend (Django)
- **Development**: `runserver` with hot reload
- **Production**: Gunicorn with 3 workers
- Port `8000`
- Auto-runs migrations on startup

### 🎨 Frontend (React)
- **Development**: Vite dev server with hot reload
- **Production**: Nginx serving static files
- Port `3000` (prod) or `5173` (dev)

### 🤖 Telegram Bot (Optional)
- Runs `python manage.py runbot`
- Only starts with `--profile bot`
- Shares same database and backend image

## 🔧 Environment Variables

Update these in `docker-compose.yml`:

```yaml
environment:
  - DATABASE_URL=postgresql://tena_user:tena_password@db:5432/tena
  - DJANGO_SECRET_KEY=your-secret-key-change-in-production
  - TELEGRAM_BOT_TOKEN=your-telegram-bot-token
  - GEMINI_API_KEY=your-gemini-api-key
  - MINI_APP_URL=https://your-domain.com
  - FRONTEND_ORIGIN=https://your-domain.com
```

## 📁 File Structure

```
hackaton/
├── backend/
│   ├── Dockerfile           # Production backend
│   ├── .dockerignore
│   └── ...
├── frontend/
│   ├── Dockerfile           # Production frontend  
│   ├── Dockerfile.dev       # Development frontend
│   ├── nginx.conf           # Nginx config for production
│   ├── .dockerignore
│   └── ...
├── docker-compose.yml       # Production setup
├── docker-compose.dev.yml   # Development setup
└── DOCKER.md                # This file
```

## 🚀 Commands

### Build and Run
```bash
# Development (with hot reload)
docker-compose -f docker-compose.dev.yml up --build

# Production (detached)
docker-compose up --build -d

# With Telegram bot
docker-compose --profile bot up --build -d
```

### Stop and Clean
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes database)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f bot
```

### Database Management
```bash
# Run migrations manually
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access Django shell
docker-compose exec backend python manage.py shell
```

## 🔌 Access Points

Once running:

- **Frontend**: http://localhost:3000 (prod) or http://localhost:5173 (dev)
- **Backend API**: http://localhost:8000/api
- **Database**: localhost:5432
- **Health Check**: http://localhost:8000/health

## 🐛 Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Kill processes if needed
sudo kill -9 <PID>
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up --build
```

### Permission Issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER .
```

### Build Issues
```bash
# Rebuild without cache
docker-compose build --no-cache

# Clean build
docker system prune -a
```

## 🌐 Production Deployment

For production deployment:

1. **Update environment variables** in `docker-compose.yml`
2. **Set up SSL certificates** (use Traefik or Nginx proxy)
3. **Use external database** (AWS RDS, ElephantSQL, etc.)
4. **Configure backup strategy** for database
5. **Set up monitoring** (Prometheus, Grafana)

### Example with External Database
```yaml
services:
  backend:
    environment:
      - DATABASE_URL=postgresql://user:pass@external-db.com:5432/tena
    # Remove depends_on for db service
```

## 📊 Monitoring

Check service health:
```bash
# Docker stats
docker stats

# Service health
curl http://localhost:8000/health
```

## 🔄 Development Workflow

1. Make code changes
2. `docker-compose -f docker-compose.dev.yml up --build`
3. Test at http://localhost:5173
4. Commit changes
5. Deploy with production compose file
