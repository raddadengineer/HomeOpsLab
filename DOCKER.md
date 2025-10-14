# Docker Deployment Guide

This guide explains how to run HomeOps Lab in a self-hosted Docker container.

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose V2+
- At least 2GB of available RAM
- Port 5000 and 5432 available on your host

## Quick Start

### 1. Clone or Download the Project

```bash
git clone <your-repo-url>
cd homeops-lab
```

### 2. Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Edit `.env` and set secure values:

```env
DB_PASSWORD=your_secure_database_password
SESSION_SECRET=your_random_session_secret_min_32_chars
```

**Important**: Generate a strong random session secret:

```bash
# Linux/macOS
openssl rand -base64 32

# Or use any random string generator
```

### 3. Start the Application

```bash
docker-compose up -d
```

This will:
- Pull the PostgreSQL image
- Build the HomeOps Lab application
- Start both containers
- Initialize the database

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

## Database Initialization

The database schema is automatically applied when the application starts. The first time you run the application, it will create all necessary tables.

## Persistent Data

Your data is stored in a Docker volume named `postgres_data`. This ensures your infrastructure data persists across container restarts and updates.

To backup your data:

```bash
docker-compose exec db pg_dump -U homeops homeops > backup.sql
```

To restore from backup:

```bash
docker-compose exec -T db psql -U homeops homeops < backup.sql
```

## Managing the Application

### View Logs

```bash
# All services
docker-compose logs -f

# App only
docker-compose logs -f app

# Database only
docker-compose logs -f db
```

### Stop the Application

```bash
docker-compose down
```

### Restart the Application

```bash
docker-compose restart
```

### Update the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Production Deployment

For production deployments, consider these additional steps:

### 1. Use a Reverse Proxy

Place HomeOps Lab behind a reverse proxy like Nginx or Traefik for:
- HTTPS/SSL termination
- Custom domain support
- Additional security headers

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name homeops.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Secure Environment Variables

- Use Docker secrets or a secrets management tool
- Never commit `.env` to version control
- Rotate secrets regularly

### 3. Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  app:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          memory: 512M
```

### 4. Monitoring

Monitor container health:

```bash
docker-compose ps
docker stats
```

### 5. Backups

Set up automated backups using cron:

```bash
# Add to crontab
0 2 * * * cd /path/to/homeops-lab && docker-compose exec -T db pg_dump -U homeops homeops > backups/backup-$(date +\%Y\%m\%d).sql
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker-compose logs app
```

### Database Connection Issues

Verify database is healthy:
```bash
docker-compose ps
docker-compose exec db pg_isready -U homeops
```

### Port Already in Use

Change ports in `docker-compose.yml`:
```yaml
ports:
  - "8080:5000"  # Use port 8080 instead
```

### Reset Everything

**Warning**: This will delete all data!

```bash
docker-compose down -v
docker-compose up -d
```

## Network Configuration

By default, the application listens on `0.0.0.0:5000` inside the container, making it accessible from your host machine.

For advanced networking (custom bridge networks, multiple stacks), refer to the [Docker Networking documentation](https://docs.docker.com/network/).

## Support

For issues and questions:
- Check the logs: `docker-compose logs -f`
- Review the application logs inside the container
- Ensure all environment variables are correctly set
