# Namecheap Deployment Checklist

Use this checklist to ensure successful deployment to Namecheap Stellar hosting.

## Pre-Deployment Checklist

### 1. MongoDB Atlas Setup
- [ ] Created MongoDB Atlas account
- [ ] Created a free M0 cluster
- [ ] Created database user with username and password
- [ ] Configured network access (0.0.0.0/0 for development, or server IP for production)
- [ ] Obtained connection string
- [ ] Tested connection string locally
- [ ] Added database name to connection string (e.g., `/tutoring-tool`)

### 2. Environment Configuration
- [ ] Copied `.env.production` to `.env`
- [ ] Updated `MONGODB_URI` with MongoDB Atlas connection string
- [ ] Generated strong `JWT_SECRET` (at least 32 characters)
- [ ] Added `OPENAI_API_KEY` (if using AI features)
- [ ] Updated `FRONTEND_URL` with your Namecheap domain
- [ ] Updated `GATEWAY_URL` with your Namecheap domain
- [ ] Updated `CORS_ORIGIN` with your Namecheap domain
- [ ] Set `NODE_ENV=production`

### 3. Local Testing
- [ ] Installed all dependencies: `npm run install-all`
- [ ] Built production version: `npm run build:production`
- [ ] Verified backend builds successfully (`backend/dist/` exists)
- [ ] Verified frontend builds successfully (`frontend/dist/` exists)
- [ ] Tested production server locally: `npm run start:production`
- [ ] Verified health endpoint: http://localhost:3000/api/health
- [ ] Tested frontend loads: http://localhost:3000
- [ ] Tested user registration and login locally

### 4. File Preparation
- [ ] Created deployment ZIP file (excluding node_modules and .git)
- [ ] Verified `.env` file is included in ZIP
- [ ] Verified `production-server.js` is included
- [ ] Verified both `backend/dist/` and `frontend/dist/` are included

## Namecheap cPanel Setup

### 5. Initial cPanel Configuration
- [ ] Logged into Namecheap account
- [ ] Accessed cPanel for your hosting package
- [ ] Located "Setup Node.js App" in SOFTWARE section
- [ ] Verified Node.js version 16.x or higher is available

### 6. Node.js Application Setup
- [ ] Created new Node.js application
- [ ] Selected latest Node.js version
- [ ] Set Application mode to "Production"
- [ ] Set Application root (e.g., `tutoring-tool`)
- [ ] Set Application URL to your domain
- [ ] Set Application startup file to `production-server.js`
- [ ] Created the application successfully

### 7. File Upload
- [ ] Uploaded deployment ZIP to cPanel File Manager
- [ ] Extracted ZIP to application root directory
- [ ] Verified all files extracted correctly
- [ ] Deleted ZIP file after extraction
- [ ] Created `backend/uploads` directory
- [ ] Set `backend/uploads` permissions to 755

### 8. Dependencies Installation
- [ ] Ran "NPM Install" from Node.js App interface
- [ ] Waited for installation to complete
- [ ] Verified no errors in installation log
- [ ] Confirmed node_modules directories created

### 9. Environment Variables (in cPanel)
Set these in Node.js App → Environment variables:
- [ ] `PORT` = `3000`
- [ ] `NODE_ENV` = `production`
- [ ] `MONGODB_URI` = `<your-mongodb-atlas-connection-string>`
- [ ] `JWT_SECRET` = `<your-secret-key>`
- [ ] `JWT_EXPIRES_IN` = `7d`
- [ ] `OPENAI_API_KEY` = `<your-openai-key>` (if applicable)
- [ ] `FRONTEND_URL` = `https://yourdomain.com`
- [ ] `GATEWAY_URL` = `https://yourdomain.com`
- [ ] `CORS_ORIGIN` = `https://yourdomain.com`

### 10. Application Launch
- [ ] Started/Restarted the Node.js application
- [ ] Waited 30 seconds for application to initialize
- [ ] No errors shown in cPanel

## Post-Deployment Testing

### 11. Basic Functionality Tests
- [ ] Visited domain in browser (e.g., https://yourdomain.com)
- [ ] Homepage loads successfully
- [ ] No console errors in browser developer tools
- [ ] Health endpoint works: https://yourdomain.com/api/health
- [ ] Registration page loads
- [ ] Successfully registered a test student account
- [ ] Successfully logged in with test account
- [ ] Successfully logged out

### 12. Tutor Features Test
- [ ] Registered a tutor account
- [ ] Created a test virtual space
- [ ] QR code generated successfully
- [ ] Space code displayed
- [ ] Space appears in tutor's dashboard

### 13. Student Features Test
- [ ] Logged in as student
- [ ] Joined the test space using space code
- [ ] Posted a text question
- [ ] Uploaded an image (OCR test - optional)
- [ ] Recorded voice message (if using HTTPS)

### 14. Tutor Response Test
- [ ] Logged in as tutor
- [ ] Viewed student questions
- [ ] Answered a question
- [ ] Response appears correctly

### 15. Admin Features Test
- [ ] Created admin user via MongoDB Atlas
- [ ] Logged in as admin
- [ ] Viewed archived sessions (after archiving a space)
- [ ] Session details display correctly

## Security & Performance

### 16. SSL/HTTPS Configuration
- [ ] SSL certificate installed (AutoSSL or custom)
- [ ] Site accessible via HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] Updated all URLs in `.env` to use HTTPS
- [ ] Restarted application after URL updates

### 17. Security Checks
- [ ] JWT_SECRET is strong and unique
- [ ] MongoDB Atlas network access configured (IP whitelist or 0.0.0.0/0)
- [ ] Database user has minimum required permissions
- [ ] `.env` file not publicly accessible
- [ ] Error logs don't expose sensitive information

### 18. Performance Optimization
- [ ] Enabled Gzip compression in cPanel
- [ ] Enabled browser caching
- [ ] Tested page load speed
- [ ] Verified no memory leaks (monitor resource usage)

## Monitoring & Maintenance

### 19. Logging Setup
- [ ] Located error logs in cPanel → Node.js App
- [ ] Verified logs are being written
- [ ] Checked for any startup errors
- [ ] Set up log monitoring routine

### 20. Backup Strategy
- [ ] Exported MongoDB database backup from Atlas
- [ ] Backed up uploaded files from `backend/uploads`
- [ ] Saved `.env` configuration securely (offline)
- [ ] Documented deployment configuration

## Optional Enhancements

### 21. Additional Features (Optional)
- [ ] Set up custom domain email
- [ ] Configured SPF/DKIM for emails
- [ ] Set up monitoring service (UptimeRobot, etc.)
- [ ] Configured automated database backups
- [ ] Set up staging environment for testing

## Troubleshooting Completed

### 22. Issue Resolution
- [ ] All issues from deployment resolved
- [ ] No critical errors in logs
- [ ] Performance is acceptable
- [ ] All features working as expected

## Documentation

### 23. Team Handoff
- [ ] Documented deployment process
- [ ] Shared credentials securely with team
- [ ] Created user guides for admin/tutor/student roles
- [ ] Documented any custom configurations

---

## Quick Reference

**Useful URLs:**
- Frontend: https://yourdomain.com
- API Health: https://yourdomain.com/api/health
- cPanel: https://yourdomain.com:2083
- MongoDB Atlas: https://cloud.mongodb.com

**Important Files:**
- Production server: `production-server.js`
- Environment config: `.env`
- Backend build: `backend/dist/`
- Frontend build: `frontend/dist/`
- Upload directory: `backend/uploads/`

**Common Commands:**
```bash
# Build for production
npm run build:production

# Test locally
npm run start:production

# Install dependencies
npm run install-all
```

## Status

Deployment Date: _______________
Deployed By: _______________
Domain: _______________
Status: ☐ In Progress  ☐ Complete  ☐ Issues

---

**Notes:**
_Use this section to document any specific configurations, issues encountered, or deviations from the standard process._
