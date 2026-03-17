# Docker Deployment Guide

## Overview

This guide covers deploying the Health Tracker application using Docker. The application is containerized as a single Docker image that connects to an external PostgreSQL database and automatically runs migrations on startup.

## Container Registry

Official images are published to **GitHub Container Registry (GHCR)**:

- **Registry**: `ghcr.io/dfsf5263/health-tracker`
- **Tags**: `latest`, `<version>` (from `package.json`), `sha-<commit>`, `main`
- **Immutability**: Version tags (e.g., `0.1.0`) are immutable — once published, they cannot be overwritten

```bash
docker pull ghcr.io/dfsf5263/health-tracker:latest
```

## Prerequisites

### Required Services

- **PostgreSQL** 12+ (external instance)
- **Docker Engine** 20.10+ or Docker Desktop

### Required Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/health_db` |
| `BETTER_AUTH_SECRET` | Session signing secret (32+ characters) | `your-random-secret-32-chars-min` |
| `APP_URL` | Public application URL | `https://health.example.com` |
| `RESEND_API_KEY` | [Resend](https://resend.com) API key | `re_abc123...` |
| `RESEND_FROM_EMAIL` | Sender email address | `noreply@yourdomain.com` |

### Optional Environment Variables

| Variable | Default | Description |
|---|---|---|
| `RESEND_REPLY_TO_EMAIL` | | Reply-to address for support |
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | Application port |
| `LOG_LEVEL` | `info` | Application log level |
| `SKIP_MIGRATIONS` | `false` | Skip automatic database migrations on startup |
| `ENABLE_SEEDING` | `false` | Run database seeding on startup |
| `DB_MIGRATION_MAX_RETRIES` | `10` | Maximum migration retry attempts (waiting for database) |
| `DB_MIGRATION_RETRY_DELAY` | `5` | Seconds between migration retry attempts |

## Quick Start

### Docker Compose (Recommended)

The easiest way to deploy. Includes PostgreSQL — no external database needed.

```bash
# Clone the repo (or just grab docker-compose.yml and .env.docker)
cp .env.docker .env
# Edit .env with your secrets and email config

docker compose up -d
```

The app will be available at [http://localhost:3000](http://localhost:3000). Migrations run automatically on first startup.

```bash
# Check that both services are healthy
docker compose ps

# View logs
docker compose logs -f app
```

#### Persistent Storage

By default, PostgreSQL data is stored in a Docker named volume. **If you remove the volume (e.g., `docker compose down -v`), all data will be lost.**

To store data at a known location on your host filesystem, replace the named volume with a bind mount in `docker-compose.yml`:

```yaml
services:
  db:
    volumes:
      - /opt/health-tracker/pgdata:/var/lib/postgresql/data
```

And remove the top-level `volumes:` section:

```yaml
# Remove this:
volumes:
  postgres_data:
```

This makes backups simpler — just back up the host directory when the container is stopped.

### Docker Run (Standalone)

If you have an existing PostgreSQL instance, you can run the container directly:

```bash
docker run -d \
  --name health-tracker \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/health_db" \
  -e BETTER_AUTH_SECRET="your-secret-key-32-characters-or-more" \
  -e APP_URL="http://localhost:3000" \
  -e RESEND_API_KEY="re_your_api_key" \
  -e RESEND_FROM_EMAIL="noreply@yourdomain.com" \
  --restart unless-stopped \
  ghcr.io/dfsf5263/health-tracker:latest
```

### Using an Environment File

Create `.env.production`:

```bash
DATABASE_URL=postgresql://user:password@host:5432/health_db
BETTER_AUTH_SECRET=your-secret-key-32-characters-or-more
APP_URL=https://health.example.com
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_REPLY_TO_EMAIL=support@yourdomain.com
```

Deploy:

```bash
docker run -d \
  --name health-tracker \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  ghcr.io/dfsf5263/health-tracker:latest
```

## Container Lifecycle

### Startup Sequence

The container performs the following steps on startup:

1. **Database Migration** — Runs `prisma migrate deploy` with automatic retry (up to 10 attempts, 5s apart). Skip with `SKIP_MIGRATIONS=true`.
2. **Database Seeding** — Optionally seeds default event types (enable with `ENABLE_SEEDING=true`)
3. **Cron Job** — Starts the birth control reminder scheduler in the background
4. **Application Start** — Launches the Next.js production server

### Health Monitoring

The container includes a built-in health check:

- **Endpoint**: `GET /api/health`
- **Docker Health Check**: Every 30 seconds
- **Startup Grace Period**: 60 seconds

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' health-tracker

# Call health endpoint directly
curl http://localhost:3000/api/health
```

## Database Setup

### PostgreSQL Requirements

- **Version**: PostgreSQL 12 or higher
- **Encoding**: UTF-8
- **Permissions**: The database user needs `CREATE`, `SELECT`, `INSERT`, `UPDATE`, `DELETE`

> **Using Docker Compose?** The included `docker-compose.yml` provisions PostgreSQL automatically — skip to [Migration Control](#migration-control).

### Manual Database Setup

If running the container standalone against an external database:

```sql
CREATE DATABASE health_tracker;
CREATE USER health_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE health_tracker TO health_user;
ALTER USER health_user CREATEDB; -- Required for Prisma migrations
```

The container will create all necessary tables automatically on first startup via `prisma migrate deploy`.

### Migration Control

```bash
# Normal startup (migrations run automatically with retry)
docker run ... ghcr.io/dfsf5263/health-tracker:latest

# Skip migrations (e.g., if you manage migrations separately)
docker run ... -e SKIP_MIGRATIONS=true ghcr.io/dfsf5263/health-tracker:latest

# Run with seeding (populates default event types)
docker run ... -e ENABLE_SEEDING=true ghcr.io/dfsf5263/health-tracker:latest

# Custom retry settings
docker run ... -e DB_MIGRATION_MAX_RETRIES=20 -e DB_MIGRATION_RETRY_DELAY=10 ghcr.io/dfsf5263/health-tracker:latest
```

## Production Deployment Examples

### Basic Production Setup

```bash
docker run -d \
  --name health-tracker \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  --memory=512m \
  --cpus=0.5 \
  ghcr.io/dfsf5263/health-tracker:latest
```

### With Custom Network

```bash
# Create a network for database communication
docker network create health-network

# Run on custom network
docker run -d \
  --name health-tracker \
  --network health-network \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  ghcr.io/dfsf5263/health-tracker:latest
```

### Behind a Reverse Proxy

```bash
# Run without exposing port directly (behind nginx/traefik)
docker run -d \
  --name health-tracker \
  --network web \
  --env-file .env.production \
  --restart unless-stopped \
  ghcr.io/dfsf5263/health-tracker:latest
```

#### Nginx Configuration Example

```nginx
server {
    listen 443 ssl;
    server_name health.example.com;

    ssl_certificate /etc/letsencrypt/live/health.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/health.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Essential headers for proper operation
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header svix-id $http_svix_id;
        proxy_set_header svix-timestamp $http_svix_timestamp;
        proxy_set_header svix-signature $http_svix_signature;
        proxy_set_header X-Correlation-ID $request_id;

        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Disable buffering for real-time features
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> **Note:** Set `APP_URL` to your public domain (e.g., `https://health.example.com`) so auth callbacks and email links resolve correctly.

## Building Locally

Build your own Docker image from source:

```bash
# Build for linux/amd64 (default server architecture)
docker build -t health-tracker:local .

# Build for Apple Silicon / ARM
docker build --platform linux/arm64 -t health-tracker:local .
```

Or use the convenience scripts:

```bash
# Build image
./scripts/docker-build.sh

# Build and push to a registry
./scripts/docker-build.sh --push --version v1.0.0
```

## Monitoring and Logging

### Container Logs

```bash
# Real-time logs
docker logs -f health-tracker

# Last 100 lines
docker logs --tail 100 health-tracker

# Logs with timestamps
docker logs -t health-tracker
```

### Resource Monitoring

```bash
# Real-time stats
docker stats health-tracker

# Container details
docker inspect health-tracker
```

## Backup and Recovery

### Database Backup

The Health Tracker container is stateless — all data is stored in the external PostgreSQL database.

```bash
# Create backup
pg_dump -h host -U user health_tracker > backup.sql

# Restore from backup
psql -h host -U user health_tracker < backup.sql
```

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check container logs for connection errors
docker logs health-tracker | grep -i "error\|database\|prisma"

# Verify DATABASE_URL format
# Must be: postgresql://user:password@host:port/database
```

#### Migration Errors

```bash
# Check migration output in logs
docker logs health-tracker | head -30

# Skip migrations and debug manually
docker run -it --rm \
  --env-file .env.production \
  ghcr.io/dfsf5263/health-tracker:latest \
  /bin/sh
```

#### Container Won't Start

```bash
# Run interactively to see errors
docker run -it --rm \
  --env-file .env.production \
  ghcr.io/dfsf5263/health-tracker:latest \
  /bin/sh

# Check environment variables are set
docker exec health-tracker env | grep -E "DATABASE_URL|BETTER_AUTH|RESEND"
```

## Security Considerations

### Container Security

- Runs as non-root user (`nextjs:nodejs`)
- Minimal Alpine Linux base image
- No unnecessary packages installed
- Secrets provided at runtime only — never built into the image

### Environment Security

- Use `--env-file` instead of command-line `-e` flags to avoid secrets in shell history
- Use SSL connections in `DATABASE_URL` for production (`?sslmode=require`)
- Generate a strong random `BETTER_AUTH_SECRET` (32+ characters)
- Restrict database access to the application container only

### Network Security

- Use custom Docker networks to isolate services
- Run behind a reverse proxy with TLS termination
- Use firewall rules to restrict container port access

## Performance Tuning

### Recommended Resource Limits

```bash
docker run -d \
  --memory=512m \
  --memory-swap=1g \
  --cpus=0.5 \
  --ulimit nofile=65536:65536 \
  ...
```

### Database Optimization

- Use connection pooling in the `DATABASE_URL` (e.g., PgBouncer)
- Configure appropriate PostgreSQL memory and connection settings
- Run regular `VACUUM` and `ANALYZE` maintenance

## Updates

### Updating with Docker Compose

```bash
docker compose pull
docker compose up -d
```

Migrations will run automatically on startup if the new version includes schema changes.

### Updating with Docker Run

```bash
# Pull the latest image
docker pull ghcr.io/dfsf5263/health-tracker:latest

# Stop and remove the current container
docker stop health-tracker
docker rm health-tracker

# Start with the new image
docker run -d \
  --name health-tracker \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  ghcr.io/dfsf5263/health-tracker:latest
```

Migrations will run automatically on startup if the new version includes schema changes.

### Quick Restart

```bash
docker pull ghcr.io/dfsf5263/health-tracker:latest && \
  docker stop health-tracker && \
  docker rm health-tracker && \
  docker run -d \
    --name health-tracker \
    -p 3000:3000 \
    --env-file .env.production \
    --restart unless-stopped \
    ghcr.io/dfsf5263/health-tracker:latest
```

## Useful Commands

```bash
# Quick health check
curl -f http://localhost:3000/api/health && echo " Healthy" || echo " Unhealthy"

# Resource usage snapshot
docker stats health-tracker --no-stream

# Restart container
docker restart health-tracker
```
- Use private networks when possible