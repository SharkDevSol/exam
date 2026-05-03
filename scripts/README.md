# Deployment Scripts

This directory contains scripts for deploying and maintaining the Web Exam System.

## Scripts Overview

### setup-vps.sh
Initial VPS server setup script. Installs all required dependencies and configures the server.

**Usage:**
```bash
sudo ./scripts/setup-vps.sh
```

**What it does:**
- Installs Node.js 20.x
- Installs PostgreSQL 14
- Installs Nginx
- Installs PM2 process manager
- Installs Certbot for SSL certificates
- Configures firewall (UFW)
- Creates application directories
- Sets up PostgreSQL database and user

**Requirements:**
- Must be run as root (use sudo)
- Fresh Ubuntu 20.04+ server

---

### deploy.sh
Application deployment script. Builds and deploys the application.

**Usage:**
```bash
./scripts/deploy.sh
```

**What it does:**
- Pulls latest code from GitHub
- Installs dependencies
- Builds backend (TypeScript compilation)
- Builds frontend (Vite build)
- Runs database migrations
- Restarts application with PM2
- Performs health check

**Requirements:**
- VPS setup must be completed first
- Must be run from application directory
- Git repository must be configured

---

### backup-db.sh
Database backup script. Creates compressed PostgreSQL backups.

**Usage:**
```bash
./scripts/backup-db.sh
```

**What it does:**
- Creates timestamped database backup
- Compresses backup with gzip
- Stores in /var/backups/exam-system/database/
- Removes backups older than 30 days
- Lists recent backups

**Automated backups:**
Add to crontab for daily backups at 2 AM:
```bash
crontab -e
# Add this line:
0 2 * * * /var/www/exam-system/scripts/backup-db.sh
```

---

### health-check.sh
System health check script. Verifies all components are running correctly.

**Usage:**
```bash
./scripts/health-check.sh
```

**What it checks:**
- API health endpoint (HTTP 200)
- PM2 process status
- Database connectivity
- Disk space usage
- Nginx status

**Exit codes:**
- 0: All checks passed
- 1: One or more checks failed

---

## Making Scripts Executable

On Linux/Unix systems, make scripts executable:
```bash
chmod +x scripts/*.sh
```

## Environment Requirements

All scripts expect the following directory structure:
```
/var/www/exam-system/          # Application root
├── api/                       # Backend API
├── app/                       # Frontend app
├── scripts/                   # These scripts
├── logs/                      # Application logs
└── ecosystem.config.js        # PM2 configuration

/var/backups/exam-system/      # Backup directory
└── database/                  # Database backups
```

## Configuration Files

Scripts use these configuration files:
- `api/.env.production` - Backend environment variables
- `app/.env.production` - Frontend environment variables
- `ecosystem.config.js` - PM2 process configuration
- `nginx/exam.skoolific.com.conf` - Nginx configuration

## Troubleshooting

### Script Permission Denied
```bash
chmod +x scripts/script-name.sh
```

### Database Backup Fails
Check PostgreSQL credentials in the script and ensure the database user has backup permissions.

### Deployment Fails
1. Check PM2 logs: `pm2 logs`
2. Verify environment variables in `.env.production`
3. Ensure database is running: `sudo systemctl status postgresql`
4. Check disk space: `df -h`

### Health Check Fails
Run with verbose output to see which check failed:
```bash
bash -x ./scripts/health-check.sh
```

## Security Notes

- **setup-vps.sh**: Contains default passwords that MUST be changed
- **backup-db.sh**: Backups contain sensitive data, ensure proper permissions
- **deploy.sh**: Pulls from Git, ensure SSH keys are properly configured
- All scripts log to stdout/stderr, consider redirecting to log files in production

## Maintenance Schedule

Recommended maintenance schedule:
- **Daily**: Automated database backups (via cron)
- **Weekly**: Run health-check.sh manually
- **Monthly**: Review and clean old backups
- **As needed**: Run deploy.sh for updates

## Support

For issues with scripts:
1. Check script output for error messages
2. Verify all prerequisites are met
3. Check system logs: `journalctl -xe`
4. Review application logs: `pm2 logs`
