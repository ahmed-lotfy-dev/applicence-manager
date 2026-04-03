# Fawtarly Deployment Guide

Complete guide for deploying Fawtarly to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring](#monitoring)
8. [Backup Strategy](#backup-strategy)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- Docker 24.0+
- Docker Compose 2.20+
- PostgreSQL 15+ (or Neon serverless PostgreSQL)
- Cloudflare R2 account (for object storage)
- Resend account (for email delivery)

### Recommended Infrastructure

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 1 core | 2+ cores |
| RAM | 1 GB | 2+ GB |
| Storage | 10 GB | 50+ GB SSD |
| Database | Neon Free | Neon Pro |

---

## Environment Variables

### Backend Environment

Create `apps/backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/fawtarly?sslmode=require

# Authentication
BETTER_AUTH_SECRET=<32-byte-hex-string>
BETTER_AUTH_URL=https://your-domain.com

# OAuth - GitHub
GITHUB_CLIENT_ID=<github-client-id>
GITHUB_CLIENT_SECRET=<github-client-secret>

# OAuth - Google
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>

# Object Storage (Cloudflare R2)
R2_ACCOUNT_ID=<account-id>
R2_ACCESS_KEY_ID=<access-key>
R2_SECRET_ACCESS_KEY=<secret-key>
R2_BUCKET_NAME=fawtarly-uploads
R2_PUBLIC_URL=https://uploads.your-domain.com

# Email (Resend)
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@your-domain.com

# CORS
CORS_ORIGIN=https://your-domain.com

# Optional: Redis for queues
REDIS_URL=redis://localhost:6379
```

### Frontend Environment

Create `apps/frontend/.env`:

```env
VITE_API_URL=https://your-domain.com
```

---

## Database Setup

### Option 1: Neon (Recommended)

1. Create Neon account at https://neon.tech
2. Create new project
3. Copy connection string to `DATABASE_URL`
4. Run migrations:

```bash
cd apps/backend
bun install
bun run db:migrate
```

### Option 2: Self-hosted PostgreSQL

```bash
docker run -d \
  --name fawtarly-postgres \
  -e POSTGRES_USER=fawtarly \
  -e POSTGRES_PASSWORD=secure-password \
  -e POSTGRES_DB=fawtarly \
  -v fawtarly-pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## Docker Deployment

### Quick Start

```bash
git clone https://github.com/yourusername/fawtarly.git
cd fawtarly
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your values
docker-compose up -d
```

### docker-compose.yml

The project includes a production-ready `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
    volumes:
      - ./tmp:/tmp
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
```

### Build Images

```bash
docker-compose build
```

### Start Services

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose down
```

---

## Manual Deployment

### Backend Setup

```bash
cd apps/backend

# Install Bun if not installed
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run migrations
bun run db:migrate

# Build for production
bun build ./src/index.ts --outdir ./dist --target bun

# Start production server
bun run dist/index.js
```

### Frontend Setup

```bash
cd apps/frontend

# Install dependencies
bun install

# Build for production
bun run build

# Serve with nginx or CDN
```

### Using PM2 (Node.js process manager)

```bash
# Install PM2
npm install -g pm2

# Start backend
pm2 start "bun run apps/backend/src/index.ts" --name fawtarly-backend

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

---

## SSL/TLS Configuration

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location /api {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://frontend:3000;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring

### Health Check Endpoint

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T00:00:00.000Z"
}
```

### Docker Health Checks

```bash
docker inspect --format='{{.State.Health.Status}}' fawtarly-backend
```

### Log Management

```bash
# View backend logs
docker-compose logs -f --tail=100 backend

# Export logs
docker-compose logs --no-color > logs-$(date +%Y%m%d).log
```

### Recommended Monitoring Stack

- **Uptime**: Uptime Kuma or Pingdom
- **Logs**: Loki + Grafana or Papertrail
- **Metrics**: Prometheus + Grafana
- **APM**: Sentry for error tracking

---

## Backup Strategy

### Database Backups

#### Neon Automatic Backups

Neon provides automatic backups on paid plans.

#### Manual PostgreSQL Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20260326.sql
```

#### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="fawtarly-$DATE.sql.gz"

pg_dump $DATABASE_URL | gzip > "$BACKUP_DIR/$FILENAME"

# Keep last 30 days
find $BACKUP_DIR -name "fawtarly-*.sql.gz" -mtime +30 -delete

# Upload to S3/R2
aws s3 cp "$BACKUP_DIR/$FILENAME" s3://your-backup-bucket/
```

#### Cron Job

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Application Backups

- License keys and activation data (database)
- User-uploaded files (R2)
- Environment configuration (secure storage)

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check database is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check environment variable
echo $DATABASE_URL
```

#### Authentication Not Working

```bash
# Verify BETTER_AUTH_SECRET
echo $BETTER_AUTH_SECRET

# Check BETTER_AUTH_URL matches your domain
echo $BETTER_AUTH_URL

# Verify OAuth callback URLs
# GitHub: https://your-domain.com/api/auth/callback/github
# Google: https://your-domain.com/api/auth/callback/google
```

#### PDF Generation Failing

```bash
# Check tmp directory permissions
ls -la /tmp

# Verify font files
ls -la /usr/share/fonts/

# Check worker logs
docker-compose logs backend | grep "PDF"
```

#### CORS Errors

```bash
# Verify CORS_ORIGIN matches frontend URL
echo $CORS_ORIGIN

# Check browser console for specific errors
```

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Useful Commands

```bash
# Check running containers
docker-compose ps

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U fawtarly
```

---

## Scaling Considerations

### Horizontal Scaling

1. Use load balancer (nginx, Traefik)
2. Stateless backend (session in DB)
3. Redis for shared queue
4. CDN for static assets

### Database Scaling

1. Read replicas (Neon Pro)
2. Connection pooling (pgBouncer)
3. Partition large tables

### Recommended Architecture

```
                    ┌─────────────┐
                    │   CDN       │
                    │  (Cloudflare)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Nginx     │
                    │ (Load Balancer)
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  Backend  │    │  Backend  │    │  Backend  │
    │  Instance │    │  Instance │    │  Instance │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL │
                    │   (Neon)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   (Queue)   │
                    └─────────────┘
```

---

## Security Checklist

- [ ] Strong `BETTER_AUTH_SECRET` (32+ random bytes)
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Database SSL enabled
- [ ] Rate limiting configured
- [ ] Environment secrets secured
- [ ] Regular backups scheduled
- [ ] Error monitoring enabled
- [ ] Security headers configured
- [ ] Dependency vulnerabilities scanned

---

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Review this guide
3. Open issue on GitHub
