# Fix 503 Service Unavailable Error

## Root Cause Analysis

A **503 error** means the server is unable to handle the request. Based on your setup, here are the likely causes:

### Most Common Causes (in order of likelihood):

1. ✅ **Application crashed during startup** (most likely)
2. **MongoDB connection failed**
3. **Missing environment variables**
4. **Missing node_modules**
5. **Build files don't exist**
6. **Wrong entry point configuration**

---

## 🔍 Diagnostic Steps

### Step 1: Check Application Logs

**Via SSH:**
```bash
ssh oasulqyi@oasustutoringtool.live

# Check Node.js application logs
cd /home/oasulqyi/tutoring-tool
cat logs/*.log

# Or check LiteSpeed logs
tail -f /usr/local/lsws/logs/error.log
```

**Via cPanel:**
1. Log into cPanel
2. Go to **Setup Node.js App**
3. Click on your application
4. Scroll down to **Log** section
5. Check for error messages

**Look for these errors:**
- `Cannot find module 'mongoose'` → Missing dependencies
- `MONGODB_URI environment variable is required` → Missing env var
- `ECONNREFUSED` → MongoDB not accessible
- `Error: listen EADDRINUSE` → Port already in use

---

## 🛠️ Fix #1: Install Dependencies

The most common issue after revert - dependencies need to be reinstalled.

```bash
# SSH into server
ssh oasulqyi@oasustutoringtool.live

# Navigate to backend
cd /home/oasulqyi/tutoring-tool/backend

# Install dependencies
npm install --production

# Also install at root level
cd /home/oasulqyi/tutoring-tool
npm install --production

# Restart application
touch tmp/restart.txt
# OR use cPanel "Restart" button
```

**Expected packages to install:**
- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- qrcode
- axios
- node-schedule
- express-validator
- multer

---

## 🛠️ Fix #2: Set Environment Variables

The `production-server.js` requires these environment variables:

### Required Variables:

Create/update `.env` file at `/home/oasulqyi/tutoring-tool/.env`:

```bash
# Via SSH
cd /home/oasulqyi/tutoring-tool
nano .env
```

```env
# Required
MONGODB_URI=mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool?retryWrites=true&w=majority
JWT_SECRET=fda21794197180d7386e36b9dcbc721c33cf00f2a782b98bd947998769b1a02a
JWT_EXPIRES_IN=365d

# Optional but recommended
OPENAI_API_KEY=your-openai-api-key-here
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://oasustutoringtool.live
CORS_ORIGIN=https://oasustutoringtool.live
```

Save and exit (Ctrl+X, then Y, then Enter)

**Via cPanel:**
If you can't SSH, create `.env` file using File Manager:
1. Navigate to `/home/oasulqyi/tutoring-tool/`
2. Click "New File"
3. Name it `.env`
4. Right-click → Edit
5. Paste the content above
6. Save

---

## 🛠️ Fix #3: Verify Build Files Exist

Check that compiled JavaScript files exist:

```bash
# Via SSH
cd /home/oasulqyi/tutoring-tool

# Check if backend build exists
ls -la backend/dist/

# Should see:
# - backend/dist/index.js
# - backend/dist/config/
# - backend/dist/routes/
# - backend/dist/services/
# - backend/dist/models/
```

**If dist/ folder is missing or empty:**

```bash
# Rebuild backend
cd backend
npm run build

# Check again
ls -la dist/
```

---

## 🛠️ Fix #4: Verify Frontend Build

Check frontend build exists:

```bash
cd /home/oasulqyi/tutoring-tool

# Check frontend build
ls -la frontend/dist/

# Should see:
# - frontend/dist/index.html
# - frontend/dist/assets/
```

**If frontend/dist is missing:**

```bash
cd frontend
npm install
npm run build
```

---

## 🛠️ Fix #5: Fix MongoDB Connection

Test MongoDB connection:

```bash
# Via SSH
cd /home/oasulqyi/tutoring-tool

# Test connection with Node.js
node -e "
const mongoose = require('mongoose');
const uri = 'mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool';
mongoose.connect(uri).then(() => {
  console.log('MongoDB Connected!');
  process.exit(0);
}).catch(err => {
  console.error('MongoDB Connection Failed:', err.message);
  process.exit(1);
});
"
```

**If connection fails:**
- Check MongoDB Atlas whitelist (allow all IPs: `0.0.0.0/0`)
- Verify credentials in connection string
- Check if MongoDB cluster is active

---

## 🛠️ Fix #6: Correct Server Entry Point

Verify the correct startup file is configured in cPanel:

**Via cPanel:**
1. Go to **Setup Node.js App**
2. Click on your application
3. Check **Application startup file**: should be `production-server.js`
4. Check **Application root**: should be `tutoring-tool`

**If using wrong entry point:**
- Change to `production-server.js`
- Click "Restart"

---

## 🛠️ Fix #7: Check File Permissions

Ensure proper file permissions:

```bash
# Via SSH
cd /home/oasulqyi

# Fix ownership
chown -R oasulqyi:oasulqyi tutoring-tool

# Fix permissions
chmod -R 755 tutoring-tool

# Make sure node_modules is readable
chmod -R 755 tutoring-tool/backend/node_modules
chmod -R 755 tutoring-tool/node_modules
```

---

## 🛠️ Complete Fix Procedure (Step by Step)

Follow these steps in order:

### 1. SSH into Server
```bash
ssh oasulqyi@oasustutoringtool.live
cd /home/oasulqyi/tutoring-tool
```

### 2. Check Current State
```bash
# Check if backend build exists
ls backend/dist/index.js

# Check if node_modules exists
ls backend/node_modules/mongoose

# Check logs
cat logs/*.log 2>/dev/null || echo "No logs found"
```

### 3. Install Dependencies
```bash
# Install at root
npm install --production

# Install backend dependencies
cd backend
npm install --production
cd ..
```

### 4. Create/Update .env File
```bash
nano .env
```

Paste this:
```env
MONGODB_URI=mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool?retryWrites=true&w=majority
JWT_SECRET=fda21794197180d7386e36b9dcbc721c33cf00f2a782b98bd947998769b1a02a
JWT_EXPIRES_IN=365d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://oasustutoringtool.live
CORS_ORIGIN=https://oasustutoringtool.live
```

Save (Ctrl+X, Y, Enter)

### 5. Rebuild if Necessary
```bash
# Only if backend/dist is missing or empty
cd backend
npm run build
cd ..

# Only if frontend/dist is missing or empty
cd frontend
npm install
npm run build
cd ..
```

### 6. Test MongoDB Connection
```bash
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✓ MongoDB Connected!'); process.exit(0); }).catch(err => { console.error('✗ MongoDB Failed:', err.message); process.exit(1); });"
```

### 7. Test Server Manually
```bash
# Try starting the server manually to see errors
node production-server.js
```

Watch for errors. If it starts successfully, you'll see:
```
✓ Database connected
✓ Archiving service started
✓ Tutoring Tool Server running on port 3000
```

Press Ctrl+C to stop.

### 8. Restart via cPanel
1. Log into cPanel
2. Go to **Setup Node.js App**
3. Click your application
4. Click **Restart**
5. Check logs for errors

### 9. Test the Website
```bash
curl https://oasustutoringtool.live/api/health
```

Should return:
```json
{"status":"OK","environment":"production","timestamp":"..."}
```

---

## 🎯 Most Likely Solution

Based on the error pattern, the fix is probably:

```bash
# 1. SSH in
ssh oasulqyi@oasustutoringtool.live

# 2. Install dependencies
cd /home/oasulqyi/tutoring-tool/backend
npm install --production

# 3. Restart
cd /home/oasulqyi/tutoring-tool
touch tmp/restart.txt
```

---

## 📝 What to Check in Logs

Look for these specific error patterns:

**1. Module not found:**
```
Error: Cannot find module 'mongoose'
```
**Fix:** Run `npm install --production`

**2. MongoDB connection:**
```
MongoServerError: bad auth
```
**Fix:** Check MONGODB_URI in .env file

**3. Environment variable:**
```
Error: MONGODB_URI environment variable is required
```
**Fix:** Create .env file with MONGODB_URI

**4. Port in use:**
```
Error: listen EADDRINUSE :::3000
```
**Fix:** Kill process on port 3000 or change PORT in .env

---

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] `backend/node_modules/` exists and has packages
- [ ] `backend/dist/` exists with compiled .js files
- [ ] `frontend/dist/` exists with index.html
- [ ] `.env` file exists in `/home/oasulqyi/tutoring-tool/`
- [ ] MongoDB connection string is correct
- [ ] Application starts without errors
- [ ] `/api/health` endpoint returns 200 OK
- [ ] Website loads in browser

---

## 🆘 If Still Getting 503

If the 503 persists after all fixes:

1. **Share the exact error from logs:**
   ```bash
   cat /home/oasulqyi/tutoring-tool/logs/*.log
   ```

2. **Check if it's a hosting issue:**
   - Contact Namecheap support
   - Check if Node.js is properly configured
   - Verify hosting plan supports Node.js

3. **Try minimal test:**
   Create simple test file:
   ```bash
   echo "const express = require('express'); const app = express(); app.get('/', (req, res) => res.send('OK')); app.listen(3000, () => console.log('Running'));" > test.js
   node test.js
   ```

---

**Next Step:** Follow the "Complete Fix Procedure" above and check what errors you get. Share those errors and I can provide more specific fixes!
