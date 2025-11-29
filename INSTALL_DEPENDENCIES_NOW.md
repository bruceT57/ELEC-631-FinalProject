# Install Dependencies - Fix "Cannot find module 'mongoose'" Error

## The Problem
The error is clear: **mongoose module is not installed** at `/home/oasulqyi/tutoring-tool/backend/`

The `node_modules` folder is missing because:
- It's not in git (always excluded via .gitignore)
- After git revert, dependencies need to be reinstalled

---

## ⚡ SOLUTION: Install Dependencies

You **MUST** run `npm install` on the production server.

### Method 1: Via SSH (Recommended - 5 minutes)

```bash
# 1. SSH into your server
ssh oasulqyi@oasustutoringtool.live

# 2. Navigate to backend directory
cd /home/oasulqyi/tutoring-tool/backend

# 3. Check if package.json exists
ls -la package.json

# 4. Install dependencies
npm install --production

# 5. Verify mongoose is installed
ls node_modules/mongoose

# 6. Also install at root level (for production-server.js)
cd /home/oasulqyi/tutoring-tool
npm install --production

# 7. Restart the application
touch tmp/restart.txt
```

**Expected output from npm install:**
```
added 150+ packages in 2m
```

### Method 2: Via cPanel (If you don't have SSH)

1. **Login to cPanel:**
   - Go to https://oasustutoringtool.live/cpanel
   - Enter your credentials

2. **Go to Setup Node.js App:**
   - Find **SOFTWARE** section
   - Click **"Setup Node.js App"**

3. **Find Your Application:**
   - Look for the tutoring-tool application
   - Click on it

4. **Run NPM Install:**
   - Scroll down to find **"Run NPM Install"** button
   - Click it
   - **Wait 5-10 minutes** for installation to complete
   - Watch for "Completed successfully" message

5. **Verify Installation:**
   - Check the log output
   - Should see "added XXX packages"

6. **Restart Application:**
   - Click the **"Restart"** button at the top
   - Wait for restart to complete

---

## 🔍 What This Does

When you run `npm install`, it:
1. Reads `package.json`
2. Downloads all required packages:
   - ✅ mongoose (for MongoDB)
   - ✅ express (web server)
   - ✅ bcryptjs (password hashing)
   - ✅ jsonwebtoken (authentication)
   - ✅ cors (cross-origin requests)
   - ✅ dotenv (environment variables)
   - ✅ qrcode (QR code generation)
   - ✅ axios (HTTP requests)
   - ✅ node-schedule (archiving scheduler)
   - ✅ express-validator (input validation)
   - ✅ multer (file uploads)
3. Installs them to `node_modules/` folder
4. Your app can now find `mongoose`

---

## ✅ Verify the Fix

After running `npm install`, check:

### 1. Verify node_modules exists:
```bash
# Via SSH
ls -la /home/oasulqyi/tutoring-tool/backend/node_modules/ | wc -l
# Should show 150+ directories
```

### 2. Verify mongoose specifically:
```bash
# Via SSH
ls -la /home/oasulqyi/tutoring-tool/backend/node_modules/mongoose
# Should show the mongoose directory
```

### 3. Test the application:
```bash
# Via browser or curl
curl https://oasustutoringtool.live/api/health
```

**Expected response:**
```json
{"status":"OK","environment":"production","timestamp":"2025-XX-XX..."}
```

### 4. Visit the website:
Open in browser:
- https://oasustutoringtool.live

Should show the tutoring tool homepage (not 503 error).

---

## 🚨 Troubleshooting

### Issue: "npm: command not found"

**Solution:** Node.js/npm not installed or not in PATH.

**Check:**
```bash
which node
which npm
node --version
npm --version
```

**If not found**, contact your hosting provider to install Node.js.

### Issue: "EACCES: permission denied"

**Solution:** Permission issues.

**Fix:**
```bash
# Make sure you own the directory
sudo chown -R oasulqyi:oasulqyi /home/oasulqyi/tutoring-tool

# Try install again
cd /home/oasulqyi/tutoring-tool/backend
npm install --production
```

### Issue: "No package.json found"

**Solution:** package.json file is missing.

**Check:**
```bash
ls /home/oasulqyi/tutoring-tool/backend/package.json
```

**If missing**, you need to upload it from your local machine:
```bash
# From your local machine
scp tutoring-tool/backend/package.json oasulqyi@oasustutoringtool.live:/home/oasulqyi/tutoring-tool/backend/
```

### Issue: Install completes but still getting error

**Solution:** Install at both locations:

```bash
# Install at backend level
cd /home/oasulqyi/tutoring-tool/backend
npm install --production

# Install at root level
cd /home/oasulqyi/tutoring-tool
npm install --production

# Restart
touch tmp/restart.txt
```

---

## 📋 Complete Installation Steps

Here's the complete process step by step:

### Step 1: Connect to Server
```bash
ssh oasulqyi@oasustutoringtool.live
```

### Step 2: Navigate to Project
```bash
cd /home/oasulqyi/tutoring-tool
pwd
# Should show: /home/oasulqyi/tutoring-tool
```

### Step 3: Check Current State
```bash
# Check if backend exists
ls -la backend/

# Check if package.json exists
ls -la backend/package.json

# Check if node_modules exists (probably doesn't)
ls -la backend/node_modules/ 2>/dev/null || echo "node_modules NOT FOUND - This is the problem!"
```

### Step 4: Install Backend Dependencies
```bash
cd backend
npm install --production
```

**Wait for completion** (2-5 minutes). You should see:
```
npm notice created a lockfile as package-lock.json
npm notice Run npm audit for details
added 153 packages in 2m
```

### Step 5: Verify Installation
```bash
# Check node_modules now exists
ls -la node_modules/ | head -20

# Check mongoose specifically
ls -la node_modules/mongoose

# Should see mongoose directory with files
```

### Step 6: Install Root Dependencies
```bash
cd /home/oasulqyi/tutoring-tool
npm install --production
```

### Step 7: Restart Application
```bash
# Create/touch restart file
touch tmp/restart.txt

# Or if using PM2
pm2 restart all

# Or restart via cPanel "Restart" button
```

### Step 8: Check Logs
```bash
# Check for success
tail -f logs/*.log

# Look for:
# ✓ Database connected
# ✓ Tutoring Tool Server running on port 3000
```

### Step 9: Test
```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Or from outside
curl https://oasustutoringtool.live/api/health
```

**Expected:**
```json
{"status":"OK","environment":"production","timestamp":"..."}
```

### Step 10: Open in Browser
Visit: https://oasustutoringtool.live

Should see your tutoring tool application!

---

## 🎯 The Exact Commands You Need

Copy and paste these commands one by one:

```bash
# Connect to server
ssh oasulqyi@oasustutoringtool.live

# Install backend dependencies
cd /home/oasulqyi/tutoring-tool/backend
npm install --production

# Install root dependencies
cd /home/oasulqyi/tutoring-tool
npm install --production

# Restart
touch tmp/restart.txt

# Test
curl https://oasustutoringtool.live/api/health
```

Done! The 503 error should be fixed.

---

## ⏰ How Long This Takes

- **SSH Method:** 5-10 minutes
- **cPanel Method:** 10-15 minutes (mostly waiting for npm install)

---

## 🎉 After This Works

Once dependencies are installed:
1. ✅ The 503 error will be gone
2. ✅ Website will load
3. ✅ API endpoints will work
4. ✅ You can test signup/login

---

## ❓ Need Help?

If you get stuck:
1. Share the exact error message
2. Share output of `ls -la /home/oasulqyi/tutoring-tool/backend/`
3. Share output of `npm install` command

I'll provide more specific help!

---

**Next step: Run the npm install commands above!** 🚀
