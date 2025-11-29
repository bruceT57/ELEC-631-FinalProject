# Fix MongoDB Connection String Error - URGENT

## The Problem

Error: `Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"`

**This means:** The `MONGODB_URI` environment variable is either:
1. Not set at all (undefined)
2. Set to an empty string
3. Set to an invalid value

---

## ⚡ IMMEDIATE FIX

You need to create a `.env` file with the correct MongoDB connection string.

### Via SSH:

```bash
# 1. Connect to server
ssh oasulqyi@oasustutoringtool.live

# 2. Navigate to project
cd /home/oasulqyi/tutoring-tool

# 3. Create .env file
cat > .env << 'ENVEOF'
MONGODB_URI=mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool?retryWrites=true&w=majority
JWT_SECRET=fda21794197180d7386e36b9dcbc721c33cf00f2a782b98bd947998769b1a02a
JWT_EXPIRES_IN=365d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://oasustutoringtool.live
CORS_ORIGIN=https://oasustutoringtool.live
OPENAI_API_KEY=
ENVEOF

# 4. Verify file was created
cat .env

# 5. Restart application
touch tmp/restart.txt
```

### Via cPanel File Manager:

1. **Login to cPanel**
2. **Open File Manager**
3. **Navigate to:** `/home/oasulqyi/tutoring-tool/`
4. **Click "New File"**
5. **Name it:** `.env`
6. **Right-click → Edit**
7. **Paste this content:**

```env
MONGODB_URI=mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool?retryWrites=true&w=majority
JWT_SECRET=fda21794197180d7386e36b9dcbc721c33cf00f2a782b98bd947998769b1a02a
JWT_EXPIRES_IN=365d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://oasustutoringtool.live
CORS_ORIGIN=https://oasustutoringtool.live
OPENAI_API_KEY=
```

8. **Save and close**
9. **Restart via cPanel** → Setup Node.js App → Restart

---

## ✅ After Creating .env

Test the application:

```bash
curl https://oasustutoringtool.live/api/health
```

Should return:
```json
{"status":"OK","environment":"production","timestamp":"..."}
```

---

## Why This Happened

After git revert:
- The `.env` file was not included (it's in `.gitignore`)
- The application has no environment variables
- MongoDB connection fails with "Invalid scheme" error

**The `.env` file is REQUIRED for production!**

---

## Quick Command (Copy-Paste)

```bash
ssh oasulqyi@oasustutoringtool.live
cd /home/oasulqyi/tutoring-tool
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://tutoringtool-admin:elec631fall2025admin@elec631f25.l6blgm0.mongodb.net/tutoring-tool?retryWrites=true&w=majority
JWT_SECRET=fda21794197180d7386e36b9dcbc721c33cf00f2a782b98bd947998769b1a02a
JWT_EXPIRES_IN=365d
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://oasustutoringtool.live
CORS_ORIGIN=https://oasustutoringtool.live
EOF
touch tmp/restart.txt
```

Done! The 503 error will be fixed.
