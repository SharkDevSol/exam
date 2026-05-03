# Deployment Execution Guide

**Target VPS**: 76.13.48.245  
**Domain**: exam.skoolific.com  
**Repository**: https://github.com/SharkDevSol/exam.git

This guide provides the exact commands to execute for deploying the Web Exam System to your VPS.

---

## Phase 1: VPS Server Setup (Task 22.1)

### 1.1 Connect to VPS

```bash
ssh root@76.13.48.245
```

### 1.2 Clone Repository

```bash
cd /var/www
git clone https://github.com/SharkDevSol/exam.git exam-system
cd exam-system
```

### 1.3 Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### 1.4 Run VPS Setup Script

```bash
sudo ./scripts/setup-vps.sh
```

**Expected Output:**
- ✓ Node.js 20.x installed
- ✓ PostgreSQL installed and running
- ✓ Nginx installed and running
- ✓ PM2 installed globally
- ✓ Certbot installed
- ✓ Firewall configured
- ✓ Directories created
- ✓ Database and user created

**Duration**: ~10 minutes

### 1.5 Verify Installation

```bash
# Check Node.js
node --version  # Should show v20.x.x

# Check PostgreSQL
sudo systemctl status postgresql  # Should be active (running)

# Check Nginx
sudo systemctl status nginx  # Should be active (running)

# Check PM2
pm2 --version  # Should show version number

# Check firewall
sudo ufw status  # Should show active with ports 22, 80, 443 allowed
```

---

## Phase 2: Configure Secrets and Environment (Task 22.1 continued)

### 2.1 Generate Secrets

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET: $JWT_SECRET"

# Generate Session secret
SESSION_SECRET=$(openssl rand -base64 32)
echo "SESSION_SECRET: $SESSION_SECRET"

# Generate Database password
DB_PASSWORD=$(openssl rand -base64 16)
echo "DB_PASSWORD: $DB_PASSWORD"
```

**IMPORTANT**: Save these secrets securely! You'll need them in the next step.

### 2.2 Update PostgreSQL Password

```bash
sudo -u postgres psql -c "ALTER USER exam_user WITH PASSWORD '$DB_PASSWORD';"
```

### 2.3 Create Production Environment File

```bash
cat > /var/www/exam-system/api/.env.production << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://exam_user:$DB_PASSWORD@localhost:5432/exam_system
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET
CORS_ORIGIN=https://exam.skoolific.com
SECURE_COOKIES=true
EOF
```

### 2.4 Verify Environment File

```bash
cat /var/www/exam-system/api/.env.production
```

**Check that:**
- All secrets are present
- DATABASE_URL has the correct password
- CORS_ORIGIN is https://exam.skoolific.com
- SECURE_COOKIES is true

---

## Phase 3: Configure Nginx and SSL (Task 22.3)

### 3.1 Copy Nginx Configuration

```bash
sudo cp /var/www/exam-system/nginx/exam.skoolific.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/exam.skoolific.com.conf /etc/nginx/sites-enabled/
```

### 3.2 Remove Default Nginx Site (Optional)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 3.3 Test Nginx Configuration

```bash
sudo nginx -t
```

**Expected Output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3.4 Reload Nginx

```bash
sudo systemctl reload nginx
```

### 3.5 Verify DNS Configuration

Before obtaining SSL certificate, ensure your domain points to the VPS:

```bash
nslookup exam.skoolific.com
```

**Expected Output**: Should show IP address 76.13.48.245

If DNS is not configured yet:
1. Go to your domain registrar (e.g., Namecheap, GoDaddy)
2. Add an A record: `exam.skoolific.com` → `76.13.48.245`
3. Wait for DNS propagation (can take up to 24 hours, usually 5-30 minutes)

### 3.6 Obtain SSL Certificate

```bash
sudo certbot --nginx -d exam.skoolific.com
```

**Follow the prompts:**
1. Enter your email address (for renewal notifications)
2. Agree to Terms of Service (Y)
3. Share email with EFF (optional, Y or N)
4. Choose to redirect HTTP to HTTPS (recommended: 2)

**Expected Output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/exam.skoolific.com/fullchain.pem
Key is saved at: /etc/letsencrypt/live/exam.skoolific.com/privkey.pem
```

### 3.7 Verify SSL Certificate

```bash
sudo certbot certificates
```

**Check that:**
- Certificate is valid
- Expiry date is ~90 days from now
- Domains include exam.skoolific.com

### 3.8 Test SSL Auto-Renewal

```bash
sudo certbot renew --dry-run
```

**Expected Output:**
```
Congratulations, all simulated renewals succeeded
```

---

## Phase 4: Deploy Application (Task 22.2)

### 4.1 Run Deployment Script

```bash
cd /var/www/exam-system
./scripts/deploy.sh
```

**What this does:**
1. Pulls latest code from GitHub
2. Installs backend dependencies
3. Builds backend TypeScript
4. Runs database migrations
5. Installs frontend dependencies
6. Builds frontend for production
7. Starts application with PM2
8. Runs health check

**Duration**: ~5-10 minutes

**Expected Output:**
```
🚀 Starting deployment...
✓ Code updated from GitHub
✓ Backend dependencies installed
✓ Backend built successfully
✓ Database migrations completed
✓ Frontend dependencies installed
✓ Frontend built successfully
✓ Application started with PM2
✓ Health check passed
🎉 Deployment completed successfully!
```

### 4.2 Verify PM2 Status

```bash
pm2 status
```

**Expected Output:**
```
┌─────┬──────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ status  │ restart │ uptime   │
├─────┼──────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ exam-system-api      │ online  │ 0       │ 10s      │
└─────┴──────────────────────┴─────────┴─────────┴──────────┘
```

### 4.3 Check Application Logs

```bash
pm2 logs exam-system-api --lines 50
```

**Look for:**
- "Server running on port 3000"
- "Database connected successfully"
- No error messages

### 4.4 Save PM2 Configuration

```bash
pm2 save
```

This ensures PM2 restarts the application after server reboot.

---

## Phase 5: Setup Monitoring and Backups (Task 22.4)

### 5.1 Configure Database Backups

```bash
# Test backup script
./scripts/backup-db.sh
```

**Expected Output:**
```
✓ Database backup created: /var/backups/exam-system/database/exam_system_YYYYMMDD_HHMMSS.sql.gz
```

### 5.2 Setup Automated Daily Backups

```bash
# Open crontab editor
crontab -e
```

**Add this line** (runs daily at 2 AM):
```
0 2 * * * /var/www/exam-system/scripts/backup-db.sh
```

Save and exit (Ctrl+X, then Y, then Enter in nano).

### 5.3 Verify Cron Job

```bash
crontab -l
```

**Expected Output:**
```
0 2 * * * /var/www/exam-system/scripts/backup-db.sh
```

### 5.4 Configure PM2 Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

This keeps logs under 10MB and retains 7 days of logs.

### 5.5 Setup Monitoring (Optional)

```bash
# Test monitoring script
./scripts/monitor.sh
```

To run monitoring every 5 minutes:
```bash
crontab -e
```

**Add this line:**
```
*/5 * * * * /var/www/exam-system/scripts/monitor.sh
```

---

## Phase 6: Create Admin Account

### 6.1 Generate Admin Password Hash

```bash
cd /var/www/exam-system/api
node -e "console.log(require('bcrypt').hashSync('YourSecurePassword123!', 12))"
```

**Replace `YourSecurePassword123!` with your desired admin password.**

**Copy the output hash** (starts with `$2b$12$...`)

### 6.2 Create Admin Account in Database

```bash
psql -U exam_user -d exam_system
```

**In the PostgreSQL prompt, run:**
```sql
INSERT INTO admins (id, username, password_hash, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin',
    '$2b$12$YOUR_HASH_HERE',  -- Replace with your hash from step 6.1
    NOW(),
    NOW()
);
```

**Verify admin created:**
```sql
SELECT id, username, created_at FROM admins;
```

**Exit PostgreSQL:**
```sql
\q
```

---

## Phase 7: Final Verification (Task 23)

### 7.1 Run Health Check

```bash
cd /var/www/exam-system
./scripts/health-check.sh
```

**Expected Output:**
```
🏥 Health Check - Web Exam System
✓ API is responding
✓ Database connection successful
✓ PM2 process running
✓ Nginx is running
✓ SSL certificate valid
✓ Disk space sufficient
✓ Memory usage normal
✓ All health checks passed!
```

### 7.2 Test Application URLs

Open a browser and test:

1. **Admin Portal**: https://exam.skoolific.com/admin
   - Should load login page
   - Try logging in with admin credentials

2. **Teacher Portal**: https://exam.skoolific.com/teacher
   - Should load login/register page

3. **Student Portal**: https://exam.skoolific.com/student
   - Should load login page

### 7.3 Test SSL Certificate

```bash
curl -I https://exam.skoolific.com
```

**Check for:**
- HTTP/2 200 (or 301/302 redirect)
- No SSL errors

### 7.4 Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/exam.skoolific.com.access.log
```

**Look for:**
- Successful requests (200 status codes)
- No 500 errors

Press Ctrl+C to exit.

### 7.5 Monitor PM2 Logs

```bash
pm2 logs exam-system-api --lines 100
```

**Look for:**
- No error messages
- Successful API requests

Press Ctrl+C to exit.

---

## Phase 8: End-to-End Testing

### 8.1 Admin Portal Testing

1. Login as admin
2. Create a new subject (e.g., "Mathematics")
3. Upload student bulk import Excel file
4. Download credentials file
5. View results dashboard (should be empty initially)
6. View exam passwords (should be empty initially)

### 8.2 Teacher Portal Testing

1. Register a new teacher account
2. Select the subject created by admin
3. Login with teacher credentials
4. Create a new exam
5. Add 100 questions (manually or via Excel import)
6. Publish the exam
7. Note the exam password displayed

### 8.3 Student Portal Testing

1. Login with a student account from the credentials file
2. View available exams
3. Enter exam password to start exam
4. Answer some questions
5. Test navigation (Next, Back, direct question selection)
6. Test flagging questions
7. Test auto-save (check browser console for save confirmations)
8. Submit exam
9. View results

### 8.4 Verify Complete Workflow

- [ ] Admin can create subjects
- [ ] Admin can import students
- [ ] Teacher can register and create exams
- [ ] Teacher can view exam password
- [ ] Admin can view exam passwords
- [ ] Student can discover and start exam with password
- [ ] Student timer counts down correctly
- [ ] Student answers are auto-saved
- [ ] Student can submit exam
- [ ] Student can view results
- [ ] Teacher can view student results
- [ ] Admin can view all results

---

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs exam-system-api --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart application
pm2 restart exam-system-api
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U exam_user -d exam_system -c "SELECT 1;"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Check certificate expiry
openssl s_client -connect exam.skoolific.com:443 -servername exam.skoolific.com | openssl x509 -noout -dates
```

### DNS Issues

```bash
# Check DNS resolution
nslookup exam.skoolific.com
dig exam.skoolific.com

# Check if domain points to correct IP
ping exam.skoolific.com
```

---

## Maintenance Commands

### Update Application

```bash
cd /var/www/exam-system
./scripts/deploy.sh
```

### Restart Application

```bash
pm2 restart exam-system-api
```

### View Logs

```bash
# PM2 logs
pm2 logs exam-system-api

# Nginx access logs
sudo tail -f /var/log/nginx/exam.skoolific.com.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/exam.skoolific.com.error.log
```

### Backup Database

```bash
./scripts/backup-db.sh
```

### Restore Database

```bash
# List available backups
ls -lh /var/backups/exam-system/database/

# Restore from backup
gunzip < /var/backups/exam-system/database/exam_system_TIMESTAMP.sql.gz | psql -U exam_user exam_system
```

---

## Security Checklist

- [ ] All default passwords changed
- [ ] Unique JWT and Session secrets generated
- [ ] Database password is strong and unique
- [ ] Firewall (UFW) is enabled
- [ ] SSL certificate is valid and auto-renewing
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] Security headers are present in responses
- [ ] Rate limiting is active on login endpoints
- [ ] Admin credentials stored securely
- [ ] Database backups are automated

---

## Post-Deployment Notes

**Deployment Date**: _______________

**Admin Username**: admin

**Admin Password**: _______________ (store securely!)

**Database Password**: _______________ (store securely!)

**JWT Secret**: _______________ (store securely!)

**Session Secret**: _______________ (store securely!)

**SSL Certificate Expiry**: _______________ (check with `sudo certbot certificates`)

**Next SSL Renewal**: _______________ (automatic, ~60 days before expiry)

---

## Success Criteria

✅ All three portals accessible via HTTPS  
✅ SSL certificate valid  
✅ PM2 process running  
✅ Database accessible  
✅ Health check passes  
✅ Admin account created  
✅ End-to-end workflow tested  
✅ Automated backups configured  
✅ Monitoring setup (optional)  

---

**Deployment Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Completed

**Deployed By**: _______________

**Verified By**: _______________

---

## Next Steps After Deployment

1. **Create Initial Data**:
   - Create all required subjects
   - Import student lists for each class
   - Notify teachers to register

2. **User Training**:
   - Train admin on system management
   - Train teachers on exam creation
   - Provide student login instructions

3. **Monitoring**:
   - Monitor application logs daily
   - Check disk space weekly
   - Review backup success daily

4. **Maintenance Schedule**:
   - Weekly: Check application health
   - Monthly: Review and clean old logs
   - Quarterly: Update dependencies and security patches

---

**For detailed information, see:**
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `QUICKSTART.md` - Quick start guide
- `PRE-DEPLOYMENT-CHECKLIST.md` - Pre-deployment checklist
- `scripts/` - All deployment scripts

