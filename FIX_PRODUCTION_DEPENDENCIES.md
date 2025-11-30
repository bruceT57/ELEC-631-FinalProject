# Fix Production Server - Missing Dependencies

## Error Analysis

**Error:** `Cannot find module 'mongoose'`

**Location:** `/home/oasulqyi/tutoring-tool/backend/dist/config/database.js`

**Cause:** Node modules are not installed on the production server.

---

## Problem

The production server at `/home/oasulqyi/tutoring-tool/` is missing the `node_modules` directory with all dependencies (mongoose, express, etc.).

**Path structure on server:**
```
/home/oasulqyi/tutoring-tool/
├── backend/
│   ├── dist/               ✅ Compiled code exists
│   ├── package.json        ❓ Need to verify
│   └── node_modules/       ❌ MISSING - This is the problem!
├── production-server.js    ✅ Entry point exists
└── ...
```

---

## Solution: Install Dependencies on Production Server

You need to SSH into your production server and install the dependencies.

### Step 1: SSH into Your Server

```bash
ssh oasulqyi@your-server-ip
# OR
ssh oasulqyi@oasustutoringtool.live
```

### Step 2: Navigate to Backend Directory

```bash
cd /home/oasulqyi/tutoring-tool/backend
```

### Step 3: Check if package.json Exists

```bash
ls -la package.json
```

**If package.json exists:** Continue to Step 4

**If package.json is missing:** You need to upload it from your local machine first.

### Step 4: Install Dependencies

```bash
npm install --production
```

This will install all dependencies listed in `package.json`:
- mongoose
- express
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- And all other required packages

**Expected output:**
```
added 150+ packages
```

### Step 5: Verify Installation

```bash
ls -la node_modules/mongoose
```

Should show the mongoose directory exists.

### Step 6: Restart the Application

Depending on your hosting setup:

**If using PM2:**
```bash
pm2 restart all
# OR
pm2 restart tutoring-tool
```

**If using cPanel/LiteSpeed:**
- Log into cPanel
- Go to "Setup Node.js App"
- Click "Restart" on your application

**If using systemd:**
```bash
sudo systemctl restart tutoring-tool
```

---

## Alternative: Install from Project Root

If you have multiple services (backend, gateway, frontend):

```bash
cd /home/oasulqyi/tutoring-tool

# Install backend dependencies
cd backend
npm install --production

# Install gateway dependencies (if deployed)
cd ../gateway
npm install --production

# Return to root
cd ..
```

---

## Verify the Fix

After installing dependencies and restarting:

**Test the backend:**
```bash
curl http://localhost:5000/health
# OR
curl https://oasustutoringtool.live/api/health
```

**Expected response:**
```json
{"status":"OK","timestamp":"..."}
```

---

## Common Issues

### Issue 1: "npm: command not found"

**Solution:** Install Node.js and npm on the server:
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, contact your hosting provider
# OR install via nvm (if you have sudo access)
```

### Issue 2: "Permission denied"

**Solution:** Ensure you own the directory:
```bash
ls -la /home/oasulqyi/tutoring-tool/backend
```

If owned by a different user, fix permissions:
```bash
sudo chown -R oasulqyi:oasulqyi /home/oasulqyi/tutoring-tool
```

### Issue 3: "No package.json found"

**Solution:** Upload package.json from your local machine:

**From your local machine:**
```bash
scp tutoring-tool/backend/package.json oasulqyi@your-server:/home/oasulqyi/tutoring-tool/backend/
```

### Issue 4: "EACCES: permission denied" during npm install

**Solution:** Don't use sudo with npm. Fix directory ownership instead:
```bash
sudo chown -R oasulqyi:oasulqyi /home/oasulqyi/tutoring-tool/backend
npm install --production
```

---

## Using cPanel File Manager (Alternative Method)

If you don't have SSH access:

### Step 1: Check if package.json Exists
1. Log into cPanel
2. Open File Manager
3. Navigate to `/home/oasulqyi/tutoring-tool/backend/`
4. Check if `package.json` exists

### Step 2: Install Dependencies via cPanel
1. In cPanel, go to **Software** → **Setup Node.js App**
2. Find your backend application
3. Click on it
4. Scroll down
5. Click **"Run NPM Install"** button
6. Wait for completion (may take 5-10 minutes)

### Step 3: Restart Application
1. Click **"Restart"** button
2. Check logs for errors

---

## Quick Fix Commands (Copy & Paste)

**For SSH access:**
```bash
# Connect to server
ssh oasulqyi@oasustutoringtool.live

# Navigate and install
cd /home/oasulqyi/tutoring-tool/backend
npm install --production

# Restart (adjust based on your setup)
pm2 restart all
# OR touch tmp/restart.txt
# OR restart via cPanel
```

---

## What Happened?

When you reverted the code using git, the `node_modules` directory was likely:
1. Not uploaded to the server (it's usually in `.gitignore`)
2. Deleted during revert
3. Never installed after deployment

**node_modules is never committed to git** - it must be installed on each server using `npm install`.

---

## Prevention for Future Deployments

1. **Always run `npm install`** after deploying code
2. **Check package.json exists** before running npm install
3. **Use a deployment script** that automatically installs dependencies
4. **Document the deployment process** so you don't forget this step

---

## Next Steps

1. ✅ SSH into production server
2. ✅ Navigate to `/home/oasulqyi/tutoring-tool/backend`
3. ✅ Run `npm install --production`
4. ✅ Restart the application
5. ✅ Test: `curl https://oasustutoringtool.live/api/health`

Once dependencies are installed, the `Cannot find module 'mongoose'` error will be resolved.

---

**Need help with SSH access or specific hosting setup? Let me know!**
