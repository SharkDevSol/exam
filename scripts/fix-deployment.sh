#!/bin/bash

# Fix Deployment Issues Script
# This script fixes the session table and environment variable issues

set -e

echo "🔧 Fixing deployment issues..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Navigate to project directory
cd /var/www/exam-system

echo -e "${YELLOW}📝 Step 1: Updating .env.production with correct credentials...${NC}"

# Update .env.production with the actual secrets
cat > api/.env.production << 'EOF'
# Production Environment Configuration
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://exam_user:aa1ddf60d570149b2bb734e8f0062407@localhost:5432/exam_system

# Authentication Secrets
JWT_SECRET=gFbJWHPk9GR68kaDjN4XWeuFIymXnzL9EzvMRUH0chw=
SESSION_SECRET=yqJA5Jlmt+zfep+L1Ebt5BbxbA0OmxoFOZ7BZhL5DZ0=

# CORS Configuration
CORS_ORIGIN=https://exam.skoolific.com

# Security Settings
SECURE_COOKIES=true
EOF

# Set correct ownership
chown examuser:examuser api/.env.production
chmod 600 api/.env.production

echo -e "${GREEN}✅ Environment file updated${NC}"

echo -e "${YELLOW}📝 Step 2: Verifying session table exists...${NC}"

# Check if session table exists
SESSION_TABLE_EXISTS=$(sudo -u postgres psql -d exam_system -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions');")

if [ "$SESSION_TABLE_EXISTS" = "t" ]; then
    echo -e "${GREEN}✅ Session table already exists${NC}"
else
    echo -e "${YELLOW}⚠️  Session table missing, creating it...${NC}"
    sudo -u postgres psql -d exam_system << 'EOSQL'
-- Sessions table for express-session
CREATE TABLE sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Create index on expire column for session cleanup
CREATE INDEX IDX_session_expire ON sessions (expire);
EOSQL
    echo -e "${GREEN}✅ Session table created${NC}"
fi

echo -e "${YELLOW}📝 Step 3: Adding trust proxy setting to server...${NC}"

# Check if trust proxy is already set
if grep -q 'app.set("trust proxy"' api/dist/server.js; then
    echo -e "${GREEN}✅ Trust proxy already configured${NC}"
else
    # Backup the original
    cp api/dist/server.js api/dist/server.js.backup
    
    # Add trust proxy setting after app initialization
    sed -i '/const app = express();/a app.set("trust proxy", true);' api/dist/server.js
    
    echo -e "${GREEN}✅ Trust proxy setting added${NC}"
fi

echo -e "${YELLOW}📝 Step 4: Restarting PM2...${NC}"

# Stop existing processes
sudo -u examuser pm2 delete exam-system-api 2>/dev/null || true

# Start with updated configuration
sudo -u examuser pm2 start ecosystem.config.js

# Save PM2 configuration
sudo -u examuser pm2 save

echo -e "${GREEN}✅ PM2 restarted${NC}"

# Wait for server to start
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 5

echo -e "${YELLOW}📝 Step 5: Testing the deployment...${NC}"

# Test health endpoint
echo -e "\n${YELLOW}Testing health endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo "FAILED")
if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed: $HEALTH_RESPONSE${NC}"
fi

# Test admin login
echo -e "\n${YELLOW}Testing admin login...${NC}"
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST https://exam.skoolific.com/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@123"}' || echo "FAILED")

if [[ "$LOGIN_RESPONSE" == *"userId"* ]]; then
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Response: $LOGIN_RESPONSE"
    
    # Test authenticated endpoint
    echo -e "\n${YELLOW}Testing authenticated endpoint (GET /subjects)...${NC}"
    SUBJECTS_RESPONSE=$(curl -s -b /tmp/cookies.txt https://exam.skoolific.com/api/admin/subjects || echo "FAILED")
    
    if [[ "$SUBJECTS_RESPONSE" != *"Unauthorized"* ]] && [[ "$SUBJECTS_RESPONSE" != "FAILED" ]]; then
        echo -e "${GREEN}✅ Session persistence working${NC}"
        echo "Response: $SUBJECTS_RESPONSE"
    else
        echo -e "${RED}❌ Session persistence failed: $SUBJECTS_RESPONSE${NC}"
    fi
else
    echo -e "${RED}❌ Login failed: $LOGIN_RESPONSE${NC}"
fi

# Clean up
rm -f /tmp/cookies.txt

echo -e "\n${YELLOW}📝 Step 6: Checking PM2 status...${NC}"
sudo -u examuser pm2 status

echo -e "\n${YELLOW}📝 Step 7: Checking recent logs...${NC}"
sudo -u examuser pm2 logs exam-system-api --lines 10 --nostream

echo -e "\n${GREEN}🎉 Deployment fix complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Visit https://exam.skoolific.com/admin/login"
echo "2. Login with username: admin, password: Admin@123"
echo "3. If you still see issues, check logs with: sudo -u examuser pm2 logs exam-system-api"
