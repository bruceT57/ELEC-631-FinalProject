# Quick Fix: Admin Routes Not Found

## Issue
Admin user management showing "API route not found" error.

## Root Cause
The `production-server.js` was missing the admin routes import and registration.

## Fix Applied

Updated `production-server.js`:

1. Added admin routes import:
```javascript
const adminRoutes = require('./backend/dist/routes/admin').default;
```

2. Added admin routes registration:
```javascript
app.use('/api/admin', adminRoutes);
```

## Deployment

### Upload Fixed File

```bash
scp tutoring-tool/production-server.js oasulqyi@oasustutoringtool.live:/home/oasulqyi/tutoring-tool/
```

### Restart Application

**Via SSH:**
```bash
ssh oasulqyi@oasustutoringtool.live
cd /home/oasulqyi/tutoring-tool
touch tmp/restart.txt
```

**OR via cPanel:**
1. Login to cPanel
2. Setup Node.js App
3. Click your application
4. Click "Restart"

### Test

1. Login as admin
2. Go to Admin Dashboard
3. Click "User Management" tab
4. Should now load user list successfully

## Verification

After restart, the admin routes should be accessible:
- `GET /api/admin/users` ✅
- `POST /api/admin/users` ✅
- `PUT /api/admin/users/:id` ✅
- `DELETE /api/admin/users/:id` ✅
- `PUT /api/admin/users/:id/reset-password` ✅

---

**Status:** Fixed - Ready to deploy
