# VPS Update Instructions

## What Was Fixed

1. **Shorter Usernames** - Changed from `firstname_lastname_123` to `firstnamel123` (first name + last initial + 3 digits)
2. **Credentials Download** - Passwords now cached in memory for 10 minutes after import, so they show in the download file
3. **Students List** - Added new endpoint `/api/admin/students` to view all imported students

## Update Commands

Run these commands on your VPS as root:

```bash
# Navigate to project directory
cd /var/www/exam-system

# Pull latest changes from GitHub
git pull origin main

# Rebuild the backend
cd api
npm run build

# Restart PM2
cd /var/www/exam-system
sudo -u examuser pm2 restart exam-system-api

# Wait for restart
sleep 3

# Check status
sudo -u examuser pm2 status

# Test the new endpoint
curl -b /tmp/cookies.txt https://exam.skoolific.com/api/admin/students

echo ""
echo "✅ Update complete!"
echo ""
echo "Changes:"
echo "1. Usernames are now shorter (e.g., 'ahmeda123' instead of 'ahmed_ali_1234')"
echo "2. Passwords will show in credentials download (download within 10 minutes of import)"
echo "3. You can now view all students in the admin dashboard"
```

## Testing

1. **Test Shorter Usernames:**
   - Upload a new batch of students
   - Download credentials immediately
   - Check that usernames are shorter (firstname + last initial + 3 digits)

2. **Test Credentials Download:**
   - Upload students
   - Click "Download Credentials" immediately
   - Open the Excel file - passwords should be visible now

3. **Test Students List:**
   - After uploading students, they should appear in a list
   - (Frontend component needs to be added to display this)

## Frontend Update Needed

The backend now has the `/api/admin/students` endpoint, but you'll need to create a frontend page to display the students list. This can be added later as a new admin dashboard page.

## Notes

- Credentials are cached in memory for 10 minutes after import
- After 10 minutes, passwords cannot be retrieved (they're hashed in the database)
- Always download credentials immediately after importing students
- The username format is now: `<firstname><last_initial><3_digits>` (e.g., "ahmeda123", "fatimah456")
