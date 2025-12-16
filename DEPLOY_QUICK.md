# 🚀 Quick Deployment Reference Card

## Before You Start

- [ ] Node.js 16+ installed
- [ ] Namecheap Stellar hosting account with cPanel
- [ ] MongoDB Atlas account (free at https://cloud.mongodb.com)
- [ ] Your domain configured

## 3-Step Deployment

### Step 1: Prepare Locally (5 minutes)

```bash
cd tutoring-tool

# Install & build
npm run deploy:prepare

# Configure environment
cp .env.production .env
# Edit .env - add MongoDB Atlas connection string

# Test locally
npm run start:production
# Visit http://localhost:3000
```

### Step 2: Setup MongoDB Atlas (5 minutes)

1. Create free cluster at https://cloud.mongodb.com
2. Create database user
3. Allow network access (0.0.0.0/0)
4. Copy connection string
5. Add to `.env` file

**See**: [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md)

### Step 3: Deploy to Namecheap (10 minutes)

**In cPanel:**
1. Go to "Setup Node.js App"
2. Create application:
   - App root: `tutoring-tool`
   - Startup file: `production-server.js`
   - Node version: Latest (16+)

3. Upload files (File Manager or FTP)

4. Set environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your domain)
   - `NODE_ENV=production`

5. Run NPM Install

6. Start/Restart app

**See**: [NAMECHEAP_DEPLOYMENT.md](NAMECHEAP_DEPLOYMENT.md)

## Essential Files

| File | Purpose |
|------|---------|
| `production-server.js` | Main server file |
| `.env` | Your configuration |
| `backend/dist/` | Compiled backend |
| `frontend/dist/` | Built frontend |
| `package.json` | Dependencies |

## Environment Variables (Minimum Required)

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tutoring-tool
JWT_SECRET=your-random-32-character-secret-key
FRONTEND_URL=https://yourdomain.com
GATEWAY_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

## Quick Test

After deployment, verify:

1. ✅ Homepage loads: `https://yourdomain.com`
2. ✅ Health check: `https://yourdomain.com/api/health`
3. ✅ Register new user
4. ✅ Login works

## Common Issues

**App won't start?**
- Check MongoDB Atlas connection string
- Verify environment variables in cPanel
- Check error logs in cPanel

**Can't connect to database?**
- MongoDB Atlas network access = 0.0.0.0/0
- Connection string includes username & password
- Database name added to connection string

**404 errors?**
- Verify `frontend/dist/` uploaded
- Check application root path in cPanel
- Restart Node.js app

## Need Help?

📖 **Full Guides**:
- [NAMECHEAP_DEPLOYMENT.md](NAMECHEAP_DEPLOYMENT.md) - Complete guide
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - 23-point checklist
- [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) - Database setup

📊 **Local Development**:
- [QUICKSTART.md](QUICKSTART.md) - 5-minute local setup
- [README.md](README.md) - Full documentation

## Support

- Namecheap Support: https://www.namecheap.com/support/
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/

---

**Total Time**: ~20 minutes for first deployment
**Skill Level**: Beginner friendly with guides
