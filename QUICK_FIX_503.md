# ⚡ Quick Fix for 503 Error

## Most Likely Cause
After the git revert, **node_modules** are missing or the app crashed during startup.

---

## 🎯 Quick Fix (5 minutes)

### Via SSH:

```bash
# 1. Connect
ssh oasulqyi@oasustutoringtool.live

# 2. Go to project
cd /home/oasulqyi/tutoring-tool

# 3. Install dependencies
cd backend
npm install --production

# 4. Go back to root
cd ..

# 5. Create .env file if missing
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool?retryWrites=true&w=majority
JWT_SECRET=fda21794197180d7386e36b9dcbc721c33cf00f2a782b98bd947998769b1a02a
JWT_EXPIRES_IN=365d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://oasustutoringtool.live
CORS_ORIGIN=https://oasustutoringtool.live
EOF

# 6. Restart
touch tmp/restart.txt
```

### Via cPanel:

1. **Install Dependencies:**
   - Login to cPanel
   - Go to **Setup Node.js App**
   - Click your application
   - Click **"Run NPM Install"**
   - Wait 5-10 minutes

2. **Set Environment Variables:**
   - Still in Setup Node.js App
   - Scroll to **Environment Variables**
   - Add these:
     - `MONGODB_URI` = `mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool?retryWrites=true&w=majority`
     - `JWT_SECRET` = `fda21794197180d7386e36b9dcbc721c33cf00f2a782b98bd947998769b1a02a`
     - `NODE_ENV` = `production`
     - `PORT` = `3000`

3. **Restart:**
   - Click **"Restart"** button

---

## 🧪 Test

```bash
curl https://oasustutoringtool.live/api/health
```

**Expected:**
```json
{"status":"OK","environment":"production","timestamp":"..."}
```

---

## 🔍 Check Logs

**Via SSH:**
```bash
cd /home/oasulqyi/tutoring-tool
cat logs/*.log
```

**Via cPanel:**
- Setup Node.js App → Your App → Scroll to Logs

**Look for:**
- ✅ "✓ Tutoring Tool Server running on port 3000"
- ✅ "✓ Database connected"
- ❌ "Cannot find module 'mongoose'" → Run npm install
- ❌ "MONGODB_URI environment variable is required" → Add .env

---

## 📋 Checklist

- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env` file exists with MONGODB_URI
- [ ] Application restarted
- [ ] No errors in logs
- [ ] `/api/health` returns 200 OK

---

**Still not working?** See `FIX_503_ERROR_DETAILED.md` for comprehensive troubleshooting.
