# Pre-Deployment Checklist

Use this checklist before deploying to production to ensure everything is configured correctly.

## Server Preparation

### VPS Access
- [ ] SSH access to VPS (76.13.48.245) confirmed
- [ ] Root or sudo privileges available
- [ ] Server running Ubuntu 20.04 or later

### Domain Configuration
- [ ] Domain (exam.skoolific.com) registered
- [ ] DNS A record points to VPS IP (76.13.48.245)
- [ ] DNS propagation completed (check with `nslookup exam.skoolific.com`)
- [ ] Port 80 and 443 accessible from internet

### Repository Access
- [ ] GitHub repository accessible
- [ ] SSH keys configured for Git access (if using private repo)
- [ ] Latest code pushed to main branch

## Security Configuration

### Secrets Generation
- [ ] JWT secret generated (use: `openssl rand -base64 32`)
- [ ] Session secret generated (use: `openssl rand -base64 32`)
- [ ] Database password generated (use: `openssl rand -base64 16`)
- [ ] All secrets stored securely (password manager recommended)

### Environment Files
- [ ] `api/.env.production` created with production values
- [ ] `app/.env.production` created with production API URL
- [ ] No `.env` files committed to Git
- [ ] `.gitignore` includes `.env*` (except `.env.example`)

### Database Security
- [ ] PostgreSQL password changed from default
- [ ] Database user has appropriate permissions only
- [ ] PostgreSQL not exposed to public internet (unless required)

## Application Configuration

### Backend Configuration
- [ ] `NODE_ENV=production` in environment
- [ ] `CORS_ORIGIN` set to production domain
- [ ] `SECURE_COOKIES=true` enabled
- [ ] Database connection string correct
- [ ] Port 3000 available for API

### Frontend Configuration
- [ ] `VITE_API_URL` points to production API
- [ ] PWA manifest configured correctly
- [ ] Service worker scope set to `/student/`
- [ ] Icons generated for PWA (192x192, 512x512)

### Nginx Configuration
- [ ] Nginx config file reviewed
- [ ] Server name matches domain
- [ ] SSL certificate paths correct (will be set by Certbot)
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Gzip compression enabled

## Deployment Files

### Scripts
- [ ] All scripts in `scripts/` directory present
- [ ] Scripts have execute permissions (Linux: `chmod +x scripts/*.sh`)
- [ ] Script paths updated if application directory differs from `/var/www/exam-system`

### PM2 Configuration
- [ ] `ecosystem.config.js` reviewed
- [ ] Number of instances appropriate for server resources
- [ ] Log paths correct
- [ ] Memory limits set appropriately

### Docker (Optional)
- [ ] `docker-compose.yml` reviewed if using Docker
- [ ] `.env` file created for Docker secrets
- [ ] Docker and Docker Compose installed on server

## Database Preparation

### Schema
- [ ] Migration files present in `api/migrations/`
- [ ] Migration files tested in development
- [ ] Seed data prepared (if needed)

### Backup Strategy
- [ ] Backup directory created (`/var/backups/exam-system/`)
- [ ] Backup script tested
- [ ] Backup retention policy defined (default: 30 days)
- [ ] Cron job for automated backups planned

## Testing

### Local Testing
- [ ] Application builds successfully (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Pre-Production Testing
- [ ] Database migrations run successfully
- [ ] API health endpoint responds
- [ ] Frontend builds without errors
- [ ] All three portals accessible

## Monitoring & Maintenance

### Logging
- [ ] Log directory created (`/var/www/exam-system/logs/`)
- [ ] Log rotation configured
- [ ] Log retention policy defined

### Monitoring
- [ ] Health check script tested
- [ ] Monitoring script configured (optional)
- [ ] Alert email configured in monitor script
- [ ] Monitoring cron job planned (optional)

### Backup & Recovery
- [ ] Backup script tested
- [ ] Backup restoration tested
- [ ] Backup storage location has sufficient space
- [ ] Off-site backup strategy considered

## SSL Certificate

### Let's Encrypt
- [ ] Certbot installed on server
- [ ] Domain accessible via HTTP (port 80)
- [ ] Email address ready for Let's Encrypt notifications
- [ ] Auto-renewal configured (Certbot does this automatically)

## Firewall Configuration

### UFW Rules
- [ ] UFW enabled
- [ ] Port 22 (SSH) allowed
- [ ] Port 80 (HTTP) allowed
- [ ] Port 443 (HTTPS) allowed
- [ ] Port 5432 (PostgreSQL) blocked from public (unless needed)

## Post-Deployment

### Initial Setup
- [ ] Admin account creation planned
- [ ] Initial subjects list prepared
- [ ] Test teacher account planned
- [ ] Test student accounts planned

### Verification
- [ ] Health check passes
- [ ] All three portals accessible via HTTPS
- [ ] SSL certificate valid
- [ ] PM2 process running
- [ ] Database accessible
- [ ] Nginx serving correctly

### Documentation
- [ ] Deployment documented
- [ ] Admin credentials stored securely
- [ ] Runbook created for common operations
- [ ] Team trained on deployment process

## Final Checks

### Performance
- [ ] Server resources adequate (CPU, RAM, Disk)
- [ ] Database connection pooling configured
- [ ] Static assets cached properly
- [ ] Gzip compression working

### Security
- [ ] All default passwords changed
- [ ] Security headers present in responses
- [ ] Rate limiting active on login endpoints
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Session cookies secure and httpOnly

### Compliance
- [ ] Privacy policy prepared (if required)
- [ ] Terms of service prepared (if required)
- [ ] Data retention policy defined
- [ ] GDPR compliance considered (if applicable)

## Emergency Contacts

- [ ] VPS provider support contact saved
- [ ] Domain registrar support contact saved
- [ ] Database administrator contact saved
- [ ] Development team contacts saved

## Rollback Plan

- [ ] Previous version tagged in Git
- [ ] Database backup before deployment
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging environment

---

## Sign-Off

**Deployment Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Notes**:
_______________________________________
_______________________________________
_______________________________________

---

## Quick Reference

### Generate Secrets
```bash
openssl rand -base64 32  # For JWT and Session secrets
openssl rand -base64 16  # For database password
```

### Test DNS
```bash
nslookup exam.skoolific.com
ping exam.skoolific.com
```

### Test Ports
```bash
nc -zv exam.skoolific.com 80
nc -zv exam.skoolific.com 443
```

### Check SSL
```bash
openssl s_client -connect exam.skoolific.com:443 -servername exam.skoolific.com
```

---

**Remember**: Always test in a staging environment before deploying to production!
