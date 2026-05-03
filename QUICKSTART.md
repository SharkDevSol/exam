# Quick Start Guide - Web Exam System

This guide will help you deploy the Web Exam System to your VPS in under 30 minutes.

## Prerequisites Checklist

- [ ] VPS with Ubuntu 20.04+ (IP: 76.13.48.245)
- [ ] Domain configured (exam.skoolific.com → 76.13.48.245)
- [ ] SSH access to VPS
- [ ] GitHub repository access

## 5-Step Deployment

### Step 1: Connect to VPS (2 minutes)

```bash
ssh root@76.13.48.245
```

### Step 2: Run Setup Script (10 minutes)

```bash
# Clone repository
cd /var/www
git clone https://github.com/SharkDevSol/exam.git exam-system
cd exam-system

# Make scripts executable (Linux/Mac only)
chmod +x scripts/*.sh

# Run setup
sudo ./scripts/setup-vps.sh
```

**What happens:**
- Installs Node.js, PostgreSQL, Nginx, PM2
- Creates directories and database
- Configures firewall

### Step 3: Configure Secrets (3 minutes)

```bash
# Generate secrets
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)

# Update PostgreSQL password
sudo -u postgres psql -c "ALTER USER exam_user WITH PASSWORD '$DB_PASSWORD';"

# Update environment file
cat > api/.env.production << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://exam_user:$DB_PASSWORD@localhost:5432/exam_system
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
CORS_ORIGIN=https://exam.skoolific.com
SECURE_COOKIES=true
EOF
```

### Step 4: Configure Nginx & SSL (5 minutes)

```bash
# Copy Nginx config
sudo cp nginx/exam.skoolific.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/exam.skoolific.com.conf /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Get SSL certificate
sudo certbot --nginx -d exam.skoolific.com

# Reload Nginx
sudo systemctl reload nginx
```

### Step 5: Deploy Application (5 minutes)

```bash
# Run deployment
./scripts/deploy.sh

# Verify deployment
./scripts/health-check.sh
```

## Post-Deployment

### Create Admin Account

```bash
# Generate password hash
ADMIN_PASSWORD="your_secure_password"
HASH=$(node -e "console.log(require('bcrypt').hashSync('$ADMIN_PASSWORD', 12))")

# Create admin
psql -U exam_user -d exam_system << EOF
INSERT INTO admins (id, username, password_hash, created_at, updated_at)
VALUES (gen_random_uuid(), 'admin', '$HASH', NOW(), NOW());
EOF
```

### Setup Automated Backups

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /var/www/exam-system/scripts/backup-db.sh") | crontab -
```

### Verify Everything Works

1. **Check PM2**: `pm2 status`
2. **Check Logs**: `pm2 logs exam-system-api`
3. **Test Health**: `./scripts/health-check.sh`
4. **Access Portals**:
   - Admin: https://exam.skoolific.com/admin
   - Teacher: https://exam.skoolific.com/teacher
   - Student: https://exam.skoolific.com/student

## Common Issues

### Issue: Domain not resolving
**Solution**: Wait for DNS propagation (up to 24 hours) or check DNS settings

### Issue: SSL certificate fails
**Solution**: Ensure domain points to VPS IP and port 80 is accessible

### Issue: Application won't start
**Solution**: Check logs with `pm2 logs` and verify environment variables

### Issue: Database connection fails
**Solution**: Verify PostgreSQL is running: `sudo systemctl status postgresql`

## Next Steps

1. **Create Subjects**: Login as admin and create subjects
2. **Register Teachers**: Teachers can sign up and select subjects
3. **Import Students**: Admin can bulk import students via Excel
4. **Create Exams**: Teachers can create exams with 100 questions
5. **Publish Exams**: Make exams public for students to take

## Maintenance Commands

```bash
# Update application
cd /var/www/exam-system
./scripts/deploy.sh

# Restart application
pm2 restart ecosystem.config.js

# View logs
pm2 logs exam-system-api

# Backup database
./scripts/backup-db.sh

# Health check
./scripts/health-check.sh
```

## Security Checklist

- [ ] Changed default database password
- [ ] Generated unique JWT and Session secrets
- [ ] SSL certificate installed and working
- [ ] Firewall (UFW) enabled
- [ ] Automated backups configured
- [ ] Admin account created with strong password

## Support

If you encounter issues:
1. Check logs: `pm2 logs`
2. Run health check: `./scripts/health-check.sh`
3. Review deployment guide: `DEPLOYMENT.md`
4. Check Nginx logs: `sudo tail -f /var/log/nginx/exam.skoolific.com.error.log`

## Production Checklist

Before going live:
- [ ] All secrets are unique and secure
- [ ] SSL certificate is valid
- [ ] Database backups are automated
- [ ] Admin account created
- [ ] Health check passes
- [ ] All three portals accessible
- [ ] Test exam workflow end-to-end

---

**Estimated Total Time**: 25-30 minutes

**Need Help?** See `DEPLOYMENT.md` for detailed instructions.
