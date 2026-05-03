# Deployment Files Summary

This document provides an overview of all deployment-related files created for the Web Exam System.

## Configuration Files

### Environment Configuration

| File | Purpose | Location |
|------|---------|----------|
| `api/.env.production` | Backend production environment variables | `/var/www/exam-system/api/` |
| `app/.env.production` | Frontend production environment variables | `/var/www/exam-system/app/` |
| `.env.example` | Docker environment template | Root directory |

**Key Variables:**
- `NODE_ENV`: Set to `production`
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `SESSION_SECRET`: Secret for session encryption
- `CORS_ORIGIN`: Production domain URL

### Process Management

| File | Purpose | Technology |
|------|---------|------------|
| `ecosystem.config.js` | PM2 process configuration | PM2 |
| `systemd/exam-system.service` | Systemd service file (alternative to PM2) | Systemd |

**PM2 Configuration:**
- 2 instances in cluster mode
- Auto-restart on failure
- Memory limit: 500MB
- Log rotation enabled

### Web Server Configuration

| File | Purpose | Server |
|------|---------|--------|
| `nginx/exam.skoolific.com.conf` | Production Nginx configuration | Nginx |
| `nginx/nginx-docker.conf` | Docker Nginx configuration | Nginx (Docker) |

**Nginx Features:**
- HTTPS with SSL/TLS 1.2+
- HTTP to HTTPS redirect
- Rate limiting (5 req/min for login, 100 req/min for API)
- Security headers (HSTS, X-Frame-Options, CSP, etc.)
- Gzip compression
- Static asset caching (1 year)
- Reverse proxy to API (port 3000)

### Docker Configuration (Optional)

| File | Purpose |
|------|---------|
| `Dockerfile.api` | Backend Docker image |
| `Dockerfile.app` | Frontend Docker image |
| `docker-compose.yml` | Multi-container orchestration |
| `.dockerignore` | Docker build exclusions |

**Docker Services:**
- PostgreSQL 14 (with persistent volume)
- Backend API (Node.js)
- Frontend App (Nginx)

## Deployment Scripts

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/setup-vps.sh` | Initial VPS setup | `sudo ./scripts/setup-vps.sh` |
| `scripts/deploy.sh` | Application deployment | `./scripts/deploy.sh` |
| `scripts/backup-db.sh` | Database backup | `./scripts/backup-db.sh` |
| `scripts/health-check.sh` | System health check | `./scripts/health-check.sh` |
| `scripts/monitor.sh` | Continuous monitoring | `./scripts/monitor.sh` |

### Script Details

#### setup-vps.sh
**What it installs:**
- Node.js 20.x
- PostgreSQL 14
- Nginx
- PM2
- Certbot (Let's Encrypt)
- Git, curl, wget, jq

**What it configures:**
- Firewall (UFW)
- PostgreSQL database and user
- Application directories
- Backup directories
- Log directories

**Run once:** Yes, during initial setup

#### deploy.sh
**What it does:**
1. Pulls latest code from GitHub
2. Installs dependencies
3. Builds backend (TypeScript → JavaScript)
4. Builds frontend (React → static files)
5. Runs database migrations
6. Restarts PM2 processes
7. Performs health check

**Run frequency:** Every deployment/update

#### backup-db.sh
**What it does:**
1. Creates timestamped PostgreSQL dump
2. Compresses with gzip
3. Stores in `/var/backups/exam-system/database/`
4. Removes backups older than 30 days

**Run frequency:** Daily (via cron)

**Cron setup:**
```bash
0 2 * * * /var/www/exam-system/scripts/backup-db.sh
```

#### health-check.sh
**What it checks:**
- API health endpoint (HTTP 200)
- PM2 process status
- Database connectivity
- Disk space usage
- Nginx status

**Run frequency:** On-demand or via monitoring

#### monitor.sh
**What it monitors:**
- API availability (auto-restart if down)
- PM2 process status
- Memory usage (alert if > 450MB)
- CPU usage (alert if > 80%)
- Disk space (alert if > 85%)
- Database connectivity
- Nginx status (auto-restart if down)
- SSL certificate expiration
- Recent error logs

**Run frequency:** Every 5-15 minutes (via cron, optional)

**Cron setup:**
```bash
*/15 * * * * /var/www/exam-system/scripts/monitor.sh
```

## Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| `DEPLOYMENT.md` | Comprehensive deployment guide | DevOps/Developers |
| `QUICKSTART.md` | Fast deployment guide (25-30 min) | Developers |
| `PRE-DEPLOYMENT-CHECKLIST.md` | Pre-deployment verification | DevOps/QA |
| `DEPLOYMENT-FILES-SUMMARY.md` | This file - overview of all deployment files | All |
| `scripts/README.md` | Deployment scripts documentation | Developers |

## Directory Structure

```
/var/www/exam-system/              # Application root
├── api/                           # Backend
│   ├── dist/                      # Compiled JavaScript
│   ├── src/                       # TypeScript source
│   ├── migrations/                # Database migrations
│   ├── .env.production            # Production environment
│   └── package.json
├── app/                           # Frontend
│   ├── dist/                      # Built static files
│   ├── src/                       # React source
│   ├── .env.production            # Production environment
│   └── package.json
├── scripts/                       # Deployment scripts
│   ├── setup-vps.sh
│   ├── deploy.sh
│   ├── backup-db.sh
│   ├── health-check.sh
│   ├── monitor.sh
│   └── README.md
├── nginx/                         # Nginx configs
│   ├── exam.skoolific.com.conf
│   └── nginx-docker.conf
├── systemd/                       # Systemd service
│   └── exam-system.service
├── logs/                          # Application logs
│   ├── api-out.log
│   ├── api-error.log
│   └── monitor.log
├── ecosystem.config.js            # PM2 config
├── docker-compose.yml             # Docker config
├── Dockerfile.api                 # Backend Docker image
├── Dockerfile.app                 # Frontend Docker image
├── DEPLOYMENT.md                  # Deployment guide
├── QUICKSTART.md                  # Quick start guide
└── PRE-DEPLOYMENT-CHECKLIST.md    # Checklist

/var/backups/exam-system/          # Backups
└── database/                      # Database backups
    ├── exam_system_20240101_020000.sql.gz
    └── ...

/etc/nginx/sites-available/        # Nginx configs
└── exam.skoolific.com.conf

/etc/nginx/sites-enabled/          # Enabled sites
└── exam.skoolific.com.conf -> ../sites-available/exam.skoolific.com.conf

/etc/letsencrypt/live/             # SSL certificates
└── exam.skoolific.com/
    ├── fullchain.pem
    ├── privkey.pem
    └── chain.pem
```

## Deployment Workflow

### Initial Deployment

1. **Prepare VPS** → Run `setup-vps.sh`
2. **Configure Secrets** → Update `.env.production` files
3. **Setup Nginx** → Copy config and test
4. **Get SSL** → Run Certbot
5. **Deploy App** → Run `deploy.sh`
6. **Verify** → Run `health-check.sh`
7. **Setup Backups** → Configure cron job

### Subsequent Deployments

1. **Update Code** → Push to GitHub
2. **Deploy** → Run `deploy.sh`
3. **Verify** → Run `health-check.sh`

### Monitoring

1. **Manual Check** → Run `health-check.sh`
2. **Automated** → Setup cron for `monitor.sh`
3. **Logs** → Check PM2 logs and Nginx logs

## Security Features

### Application Security
- ✅ JWT authentication for students
- ✅ Session-based auth for admin/teacher
- ✅ bcrypt password hashing (cost factor 12)
- ✅ Rate limiting on login endpoints
- ✅ Input sanitization with xss library
- ✅ CORS configured for production domain

### Server Security
- ✅ Firewall (UFW) enabled
- ✅ HTTPS enforced with SSL/TLS 1.2+
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Secure cookies (httpOnly, secure, sameSite)
- ✅ No directory listing
- ✅ Hidden files blocked (.env, .git, etc.)

### Database Security
- ✅ Strong password required
- ✅ Not exposed to public internet
- ✅ Regular automated backups
- ✅ Connection pooling with limits

## Performance Optimizations

### Application
- ✅ PM2 cluster mode (2 instances)
- ✅ Database connection pooling
- ✅ Auto-restart on failure

### Web Server
- ✅ Gzip compression
- ✅ Static asset caching (1 year)
- ✅ Keep-alive connections
- ✅ HTTP/2 enabled

### Frontend
- ✅ Vite production build
- ✅ Code splitting
- ✅ Asset optimization
- ✅ PWA with service worker

## Monitoring & Alerts

### Health Checks
- API endpoint availability
- PM2 process status
- Database connectivity
- Disk space
- Nginx status

### Alerts (via monitor.sh)
- API down → Auto-restart attempt
- High memory usage (> 450MB)
- High CPU usage (> 80%)
- Critical disk space (> 85%)
- Database connection failure
- Nginx down → Auto-restart attempt
- SSL certificate expiring (< 7 days)

### Logs
- Application logs: `/var/www/exam-system/logs/`
- Nginx logs: `/var/log/nginx/`
- PM2 logs: `pm2 logs`
- Monitor logs: `/var/www/exam-system/logs/monitor.log`

## Backup & Recovery

### Automated Backups
- **Frequency**: Daily at 2 AM
- **Location**: `/var/backups/exam-system/database/`
- **Format**: Compressed SQL dump (gzip)
- **Retention**: 30 days
- **Naming**: `exam_system_YYYYMMDD_HHMMSS.sql.gz`

### Manual Backup
```bash
./scripts/backup-db.sh
```

### Restore from Backup
```bash
gunzip < /var/backups/exam-system/database/exam_system_TIMESTAMP.sql.gz | psql -U exam_user exam_system
```

## Troubleshooting

### Common Issues

| Issue | Check | Solution |
|-------|-------|----------|
| API not responding | `pm2 logs` | Restart: `pm2 restart ecosystem.config.js` |
| Database connection failed | `sudo systemctl status postgresql` | Restart: `sudo systemctl restart postgresql` |
| Nginx not serving | `sudo nginx -t` | Fix config and reload: `sudo systemctl reload nginx` |
| SSL certificate expired | `sudo certbot certificates` | Renew: `sudo certbot renew` |
| High memory usage | `pm2 monit` | Restart or increase limit in ecosystem.config.js |
| Disk space full | `df -h` | Clean logs and old backups |

### Log Locations

- **PM2 Logs**: `pm2 logs exam-system-api`
- **Nginx Access**: `/var/log/nginx/exam.skoolific.com.access.log`
- **Nginx Error**: `/var/log/nginx/exam.skoolific.com.error.log`
- **Application**: `/var/www/exam-system/logs/`
- **PostgreSQL**: `/var/log/postgresql/`

## Maintenance Schedule

### Daily
- ✅ Automated database backup (2 AM)
- ✅ Automated monitoring (every 15 min, optional)

### Weekly
- ⚠️ Review application logs
- ⚠️ Check disk space
- ⚠️ Review error rates

### Monthly
- ⚠️ Update system packages
- ⚠️ Review backup retention
- ⚠️ Check SSL certificate expiration
- ⚠️ Review security logs

### As Needed
- ⚠️ Deploy application updates
- ⚠️ Scale resources if needed
- ⚠️ Update Node.js version
- ⚠️ Update PostgreSQL version

## Support Resources

### Documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [QUICKSTART.md](QUICKSTART.md) - Quick deployment (25-30 min)
- [PRE-DEPLOYMENT-CHECKLIST.md](PRE-DEPLOYMENT-CHECKLIST.md) - Pre-deployment checklist
- [scripts/README.md](scripts/README.md) - Scripts documentation

### Commands Reference
```bash
# PM2
pm2 status                    # Check status
pm2 logs exam-system-api      # View logs
pm2 restart ecosystem.config.js  # Restart app
pm2 monit                     # Monitor resources

# Nginx
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload config
sudo systemctl status nginx   # Check status

# PostgreSQL
sudo systemctl status postgresql  # Check status
psql -U exam_user -d exam_system  # Connect to DB

# Health & Monitoring
./scripts/health-check.sh     # Run health check
./scripts/monitor.sh          # Run monitoring
./scripts/backup-db.sh        # Backup database

# Deployment
./scripts/deploy.sh           # Deploy updates
```

---

**Last Updated**: 2024
**Version**: 1.0
**Maintainer**: Development Team
