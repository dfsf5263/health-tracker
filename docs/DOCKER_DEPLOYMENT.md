# Docker Deployment Guide

## Overview

This guide covers deploying the Health Tracker application using Docker. The application is containerized as a single Docker image that includes automatic database migrations and connects to an external PostgreSQL database.

## Docker Hub Registry

The official Health Tracker Docker images are available at:
- **Registry**: `dfsf5263/health-tracker`
- **Tags**: `latest`, version tags (e.g., `v1.0.0`)

## Prerequisites

### Required Services
- **PostgreSQL Database**: External PostgreSQL instance (version 12+)
- **Docker**: Docker Engine 20.10+ or Docker Desktop

### Required Environment Variables

```bash
# Database Connection (Required)
DATABASE_URL=postgresql://username:password@host:port/database_name

# Better Auth Configuration (Required)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=https://yourdomain.com

# Email Service (Required for notifications)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com

# Optional Configuration
NODE_ENV=production
PORT=3000
SKIP_MIGRATIONS=false
ENABLE_SEEDING=false
```

## Quick Start

### 1. Basic Deployment

```bash
docker run -d \
  --name health-tracker \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/health_db" \
  -e BETTER_AUTH_SECRET="your-secret-key" \
  -e BETTER_AUTH_URL="https://yourdomain.com" \
  -e RESEND_API_KEY="re_..." \
  -e EMAIL_FROM_ADDRESS="noreply@yourdomain.com" \
  --restart unless-stopped \
  dfsf5263/health-tracker:latest
```

### 2. Using Environment File

Create `.env.production`:
```bash
DATABASE_URL=postgresql://user:password@host:5432/health_db
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://yourdomain.com
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
NODE_ENV=production
```

Deploy with environment file:
```bash
docker run -d \
  --name health-tracker \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  dfsf5263/health-tracker:latest
```

## Container Lifecycle

### Startup Sequence

The container performs the following steps on startup:

1. **Environment Validation**: Checks required environment variables
2. **Database Connectivity**: Waits for PostgreSQL to be available
3. **Database Migration**: Runs `prisma migrate deploy` automatically
4. **Prisma Client Generation**: Ensures latest schema is available
5. **Health Check**: Validates database connection
6. **Application Start**: Launches Next.js production server

### Health Monitoring

The container includes built-in health checks:

- **Health Endpoint**: `GET /api/health`
- **Docker Health Check**: Runs every 30 seconds
- **Startup Grace Period**: 60 seconds before health checks start

Example health check response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "service": "health-tracker",
  "version": "1.0.0"
}
```

## Database Setup

### PostgreSQL Requirements

- **Version**: PostgreSQL 12 or higher
- **Extensions**: None required (using standard SQL)
- **Encoding**: UTF-8
- **Permissions**: The database user needs:
  - `CREATE` (for initial schema creation)
  - `SELECT`, `INSERT`, `UPDATE`, `DELETE` (for application operations)

### Database Migration

Migrations are handled automatically by the container:

- Runs `npx prisma migrate deploy` on startup
- Creates tables and applies schema changes
- Idempotent (safe to run multiple times)
- Can be skipped with `SKIP_MIGRATIONS=true`

### Initial Database Setup

1. Create PostgreSQL database:
```sql
create database health_prod;
create user health_user with encrypted password 'secure_password';
grant all privileges on database health_prod to health_user;
ALTER USER health_user CREATEDB;
GRANT USAGE ON SCHEMA public TO health_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO health_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO health_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO health_user;
GRANT USAGE, CREATE ON SCHEMA public TO health_user;
```

2. The application will create all necessary tables on first startup.

## Production Deployment Examples

### Basic Production Setup

```bash
# Pull latest image
docker pull dfsf5263/health-tracker:latest

# Run with production configuration
docker run -d \
  --name health-tracker-prod \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://health_user:secure_password@db.example.com:5432/health_tracker" \
  -e BETTER_AUTH_SECRET="your-secret-key" \
  -e BETTER_AUTH_URL="https://yourdomain.com" \
  -e RESEND_API_KEY="re_your_key" \
  -e EMAIL_FROM_ADDRESS="noreply@yourdomain.com" \
  -e NODE_ENV=production \
  --restart unless-stopped \
  --memory=512m \
  --cpus=0.5 \
  dfsf5263/health-tracker:latest
```

### With Custom Network

```bash
# Create network for database communication
docker network create health-network

# Run application on custom network
docker run -d \
  --name health-tracker \
  --network health-network \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  dfsf5263/health-tracker:latest
```

### Behind Reverse Proxy

```bash
# Run without exposing port (behind nginx/traefik)
docker run -d \
  --name health-tracker \
  --network web \
  --env-file .env.production \
  --restart unless-stopped \
  dfsf5263/health-tracker:latest
```

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Better Auth secret key | `your-secret-key` |
| `BETTER_AUTH_URL` | Better Auth base URL | `https://yourdomain.com` |
| `RESEND_API_KEY` | Resend email service API key | `re_...` |
| `EMAIL_FROM_ADDRESS` | Email sender address | `noreply@yourdomain.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `3000` | Application port |
| `SKIP_MIGRATIONS` | `false` | Skip database migrations |
| `ENABLE_SEEDING` | `false` | Run database seeding |
| `DB_WAIT_TIMEOUT` | `30` | Database wait timeout (seconds) |

### Better Auth Configuration

1. **Generate Secret**: Create a secure random string for `BETTER_AUTH_SECRET`
2. **Set Base URL**: Configure `BETTER_AUTH_URL` to match your domain
3. **Email Service**: Set up Resend account and configure API key
4. **Create Application**: Set up your Health Tracker app
3. **Configure URLs**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

## Container Management

### Logging

```bash
# View real-time logs
docker logs -f health-tracker

# View last 100 lines
docker logs --tail 100 health-tracker

# View logs with timestamps
docker logs -t health-tracker
```

### Health Checks

```bash
# Check container health status
docker inspect --format='{{.State.Health.Status}}' health-tracker

# Check via API endpoint
curl http://localhost:3000/api/health
```

### Resource Monitoring

```bash
# View resource usage
docker stats health-tracker

# View container details
docker inspect health-tracker
```

### Database Backup

```bash
# Create backup
docker exec -i postgres_container pg_dump -U health_user health_tracker > backup.sql

# Restore backup
docker exec -i postgres_container psql -U health_user health_tracker < backup.sql
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity from container
docker logs health-tracker | grep "DB-WAIT"

# Test database connection manually
docker run --rm --network your-network postgres:15 psql $DATABASE_URL -c "SELECT 1"
```

#### Container Startup Issues

```bash
# View startup logs
docker logs health-tracker | grep "ENTRYPOINT"

# Check environment variables
docker exec health-tracker env

# Test container startup manually
docker run --rm dfsf5263/health-tracker:latest ./scripts/wait-for-db.sh
```

#### Application Errors

```bash
# Check application logs
docker logs health-tracker | grep "ERROR"

# Run with debug mode
docker run -d \
  --name health-tracker-debug \
  -e DEBUG=* \
  -e NODE_ENV=development \
  dfsf5263/health-tracker:latest \
  node server.js
```

### Health Check Failures

If health checks are failing:

1. **Check Database**: Ensure PostgreSQL is accessible
2. **Verify Environment**: Check all required variables are set
3. **Network Issues**: Ensure container can reach database
4. **Resource Limits**: Check if container has sufficient memory/CPU

## Updates and Maintenance

### Image Updates

```bash
# Pull latest image
docker pull dfsf5263/health-tracker:latest

# Stop and remove old container
docker stop health-tracker
docker rm health-tracker

# Start with new image
docker run -d \
  --name health-tracker \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  dfsf5263/health-tracker:latest
```

### Zero-Downtime Updates

For production environments, consider using:
- **Docker Compose** with rolling updates
- **Kubernetes** deployments
- **Load balancer** with multiple instances

### Monitoring

```bash
# Check resource usage
docker stats health-tracker --no-stream

# Restart if needed
docker restart health-tracker

# Update and restart
docker pull dfsf5263/health-tracker:latest && docker restart health-tracker
```

## Security Considerations

- Use non-root database users with minimal privileges
- Secure database connections with SSL
- Regularly update Docker images
- Use secrets management for sensitive environment variables
- Run containers with resource limits
- Use private networks when possible