# Deployment Guide - Web Exam System

This guide provides step-by-step instructions for deploying the Web Exam System to a VPS server.

## Server Information

- **Domain**: exam.skoolific.com
- **VPS IP**: 76.13.48.245
- **GitHub Repository**: https://github.com/SharkDevSol/exam.git

## Prerequisites

- Ubuntu 20.04 or later
- Root or sudo access to the VPS
- Domain DNS configured to point to VPS IP
- SSH access to the server

## Deployment Options

### Option 1: Direct VPS Deployment (Recommended)

This is the recommended approach for production deployment with PM2 and Nginx.

#### Step 1: Initial VPS Setup

SSH into your VPS:
```bash
ssh root@76.13.48.245
```

Download and run the setup script:
```bash
# Clone the repository
cd /var/www
git clone https://github.com/SharkDevSol/exam.git exam-system
cd exam-system

# Make scripts executable
chmod +x scripts/*.sh

# Run VPS setup script (as root)
sudo ./scripts/setup-vps.sh
```

This script will:
- Install Node.js 20.x
- Install PostgreSQL
- Install Nginx
- Install PM2
- Install Certbot for SSL
- Configure firewall (UFW)
- Create necessary directories
- Setup PostgreSQL database and user

#### Step 2: Configure Environment Variables

Generate secure secrets:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate Session secret
openssl rand -base64 32
```

Edit production environment file:
```bash
nano /var/www/exam-system/api/.env.production
```

Update the following values:
```env
DATABASE_URL=postgresql://exam_user:YOUR_SECURE_PASSWORD@localhost:5432/exam_system
JWT_SECRET=YOUR_GENERATED_JWT_SECRET
SESSION_SECRET=YOUR_GENERATED_SESSION_SECRET
```

#### Step 3: Configure Nginx

Copy Nginx configuration:
```bash
sudo cp /var/www/exam-system/nginx/exam.skoolific.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/exam.skoolific.com.conf /etc/nginx/sites-enabled/
```

Test Nginx configuration:
```bash
sudo nginx -t
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

#### Step 4: Obtain SSL Certificate

Use Certbot to obtain Let's Encrypt SSL certificate:
```bash
sudo certbot --nginx -d exam.skoolific.com
```

Follow the prompts to:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

#### Step 5: Build and Deploy Application

Run the deployment script:
```bash
cd /var/www/exam-system
./scripts/deploy.sh
```

This script will:
- Pull latest code from GitHub
- Install dependencies
- Build backend and frontend
- Run database migrations
- Start application with PM2
- Perform health check

#### Step 6: Setup Database Backups

Configure automatic daily backups:
```bash
crontab -e
```

Add the following line to run backups daily at 2 AM:
```
0 2 * * * /var/www/exam-system/scripts/backup-db.sh
```

#### Step 7: Verify Deployment

Run health check:
```bash
./scripts/health-check.sh
```

Check PM2 status:
```bash
pm2 status
pm2 logs exam-system-api
```

Access the application:
- Admin Portal: https://exam.skoolific.com/admin
- Teacher Portal: https://exam.skoolific.com/teacher
- Student Portal: https://exam.skoolific.com/student

### Option 2: Docker Deployment (Alternative)

For development or containerized environments, you can use Docker.

#### Prerequisites
- Docker and Docker Compose installed

#### Steps

1. Clone the repository:
```bash
git clone https://github.com/SharkDevSol/exam.git
cd exam
```

2. Create `.env` file:
```bash
cat > .env << EOF
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
EOF
```

3. Build and start containers:
```bash
docker-compose up -d
```

4. Check container status:
```bash
docker-compose ps
docker-compose logs -f
```

5. Access the application at http://localhost

## Post-Deployment Tasks

### 1. Create Admin Account

Connect to the database and create an admin account:
```bash
psql -U exam_user -d exam_system
```

```sql
INSERT INTO admins (id, username, password_hash, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2b$12$YOUR_BCRYPT_HASH_HERE',
    NOW(),
    NOW()
);
```

To generate a bcrypt hash for password:
```bash
node -e "console.log(require('bcrypt').hashSync('your_password', 12))"
```

### 2. Monitor Application

View PM2 logs:
```bash
pm2 logs exam-system-api
```

View Nginx logs:
```bash
sudo tail -f /var/log/nginx/exam.skoolific.com.access.log
sudo tail -f /var/log/nginx/exam.skoolific.com.error.log
```

### 3. Setup Monitoring (Optional)

Install PM2 monitoring:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Maintenance

### Update Application

To deploy updates:
```bash
cd /var/www/exam-system
./scripts/deploy.sh
```

### Restart Application

```bash
pm2 restart ecosystem.config.js
```

### Database Backup

Manual backup:
```bash
./scripts/backup-db.sh
```

Restore from backup:
```bash
gunzip < /var/backups/exam-system/database/exam_system_TIMESTAMP.sql.gz | psql -U exam_user exam_system
```

### SSL Certificate Renewal

Certbot automatically renews certificates. To test renewal:
```bash
sudo certbot renew --dry-run
```

### Health Check

Run health check script:
```bash
./scripts/health-check.sh
```

## Troubleshooting

### Application Not Starting

Check PM2 logs:
```bash
pm2 logs exam-system-api --lines 100
```

Check if port 3000 is in use:
```bash
sudo lsof -i :3000
```

### Database Connection Issues

Check PostgreSQL status:
```bash
sudo systemctl status postgresql
```

Test database connection:
```bash
psql -U exam_user -d exam_system -c "SELECT 1;"
```

### Nginx Issues

Check Nginx configuration:
```bash
sudo nginx -t
```

Check Nginx status:
```bash
sudo systemctl status nginx
```

View Nginx error logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

Check certificate status:
```bash
sudo certbot certificates
```

Renew certificate manually:
```bash
sudo certbot renew --force-renewal
```

## Security Recommendations

1. **Change Default Passwords**: Update all default passwords in `.env.production`
2. **Enable Firewall**: Ensure UFW is enabled and configured correctly
3. **Regular Updates**: Keep system packages and Node.js updated
4. **Monitor Logs**: Regularly check application and Nginx logs
5. **Backup Database**: Ensure daily backups are running
6. **SSL Certificate**: Monitor certificate expiration
7. **Rate Limiting**: Nginx configuration includes rate limiting for login endpoints
8. **Security Headers**: All security headers are configured in Nginx

## Performance Optimization

1. **PM2 Cluster Mode**: The ecosystem.config.js uses 2 instances in cluster mode
2. **Nginx Caching**: Static assets are cached for 1 year
3. **Gzip Compression**: Enabled for text-based resources
4. **Database Connection Pooling**: Configured in the application
5. **Keep-Alive**: Enabled for upstream connections

## Support

For issues or questions:
- Check application logs: `pm2 logs`
- Run health check: `./scripts/health-check.sh`
- Review Nginx logs: `/var/log/nginx/exam.skoolific.com.error.log`

## Rollback Procedure

If deployment fails:

1. Check PM2 logs for errors
2. Restore previous version from Git:
```bash
git log --oneline
git checkout <previous-commit-hash>
./scripts/deploy.sh
```

3. Restore database from backup if needed:
```bash
gunzip < /var/backups/exam-system/database/exam_system_TIMESTAMP.sql.gz | psql -U exam_user exam_system
```
