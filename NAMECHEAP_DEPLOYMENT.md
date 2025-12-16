# Namecheap Stellar Cloud Hosting Deployment Guide

This guide will walk you through deploying the Tutoring Tool on Namecheap Stellar shared hosting.

## Overview

The deployment process has been simplified to run as a single Node.js application that:
- Serves the React frontend as static files
- Runs the backend API
- Connects to MongoDB Atlas (cloud database)

## Prerequisites

Before starting, make sure you have:

1. **Namecheap Stellar Hosting Account** with Node.js support
2. **MongoDB Atlas Account** (free tier works fine) - See [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md)
3. **OpenAI API Key** (optional, for AI difficulty ranking)
4. **Domain name** configured in Namecheap

## Deployment Steps

### Step 1: Setup MongoDB Atlas

Follow the complete guide in [MONGODB_ATLAS_SETUP.md](MONGODB_ATLAS_SETUP.md) to:
1. Create a free MongoDB Atlas cluster
2. Get your connection string
3. Configure database access

### Step 2: Prepare Your Application

On your local machine:

```bash
cd tutoring-tool

# Install all dependencies
npm run install-all

# Build for production (this compiles TypeScript and builds frontend)
npm run build:production
```

This will create:
- `backend/dist/` - Compiled backend code
- `frontend/dist/` - Production-ready frontend bundle

### Step 3: Configure Environment Variables

1. Copy the production environment template:
   ```bash
   cp .env.production .env
   ```

2. Edit `.env` and update these values:

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=production

   # MongoDB Atlas Connection (REQUIRED)
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/tutoring-tool?retryWrites=true&w=majority

   # JWT Secret (REQUIRED - generate a random string)
   JWT_SECRET=your-super-secret-random-string-at-least-32-characters-long

   # OpenAI API Key (OPTIONAL - for AI features)
   OPENAI_API_KEY=sk-your-openai-api-key-here

   # Your Domain (update with your actual domain)
   FRONTEND_URL=https://yourdomain.com
   GATEWAY_URL=https://yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   ```

**Important:**
- Replace `yourdomain.com` with your actual Namecheap domain
- Generate a secure JWT_SECRET (you can use a password generator)
- Get MONGODB_URI from MongoDB Atlas (Step 1)

### Step 4: Access Namecheap cPanel

1. Log into your Namecheap account
2. Go to **Hosting List** or **Web Hosting**
3. Click **cPanel** or **Manage** next to your hosting package
4. This will open the cPanel dashboard

### Step 5: Setup Node.js Application in cPanel

1. In cPanel, scroll to the **SOFTWARE** section
2. Click on **"Setup Node.js App"**
3. Click **"CREATE APPLICATION"** button
4. Configure:
   - **Node.js version**: Select latest available (16.x or higher recommended)
   - **Application mode**: Production
   - **Application root**: `tutoring-tool` (or your preferred folder name)
   - **Application URL**: Select your domain or subdomain
   - **Application startup file**: `production-server.js`
   - **Passenger log file**: Leave default or set to `logs/passenger.log`

5. Click **"CREATE"**

### Step 6: Upload Application Files

**Option A: Using File Manager (Recommended for first deployment)**

1. In cPanel, go to **Files** → **File Manager**
2. Navigate to the application root directory (e.g., `tutoring-tool/`)
3. Create a ZIP file of your entire project on your local machine:
   ```bash
   # On your local machine
   cd tutoring-tool
   zip -r tutoring-tool.zip . -x "node_modules/*" -x ".git/*" -x "*.log"
   ```
4. Upload `tutoring-tool.zip` using the **Upload** button in File Manager
5. Right-click the ZIP file and select **Extract**
6. Delete the ZIP file after extraction

**Option B: Using FTP/SFTP**

1. Get FTP credentials from cPanel → **Files** → **FTP Accounts**
2. Use an FTP client (FileZilla, WinSCP, etc.)
3. Upload all files to your application root directory

**Option C: Using Git (Advanced)**

1. In cPanel, go to **Files** → **Git Version Control**
2. Click **"Create"**
3. Enter your repository URL and branch
4. Set the repository path to your application root
5. Click **"Create"** to clone the repository

### Step 7: Install Dependencies

1. Go back to **Setup Node.js App** in cPanel
2. Click on your application
3. Scroll down to the **Detected configuration files** section
4. Click **"Run NPM Install"** button
5. Wait for installation to complete (this may take 2-5 minutes)

**If NPM Install fails or takes too long:**
You can use SSH Terminal (if available):
```bash
cd ~/tutoring-tool
npm install --production
cd backend && npm install --production
cd ../frontend && npm install --production
```

### Step 8: Configure Environment Variables in cPanel

1. In the Node.js App settings, scroll to **Environment variables**
2. Add each variable from your `.env` file:

   Click **"Add Variable"** for each:
   - `PORT` = `3000`
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `your-mongodb-atlas-connection-string`
   - `JWT_SECRET` = `your-secret-key`
   - `JWT_EXPIRES_IN` = `7d`
   - `OPENAI_API_KEY` = `your-openai-key` (if using)
   - `FRONTEND_URL` = `https://yourdomain.com`
   - `GATEWAY_URL` = `https://yourdomain.com`
   - `CORS_ORIGIN` = `https://yourdomain.com`

### Step 9: Create Uploads Directory

The application needs an uploads directory for file storage:

1. In File Manager, navigate to `tutoring-tool/backend/`
2. Create a new folder named `uploads`
3. Set permissions to `755` (right-click → Change Permissions)

### Step 10: Start the Application

1. Go back to **Setup Node.js App**
2. Find your application in the list
3. Click the **"Restart"** button (or **"Start"** if not running)
4. Wait for the app to restart

### Step 11: Test Your Deployment

1. Open your browser and go to your domain (e.g., `https://yourdomain.com`)
2. You should see the Tutoring Tool homepage
3. Try registering a new account
4. Test login functionality

**Health Check:**
Visit `https://yourdomain.com/api/health` - you should see:
```json
{
  "status": "OK",
  "environment": "production",
  "timestamp": "2025-..."
}
```

## Post-Deployment Configuration

### Create Admin Account

1. Register a normal user account through the web interface
2. Access MongoDB Atlas dashboard
3. Go to **Collections** → Browse your database → `users` collection
4. Find your user document
5. Edit the document and change `"role": "student"` to `"role": "admin"`
6. Save changes
7. Log out and log back in - you now have admin access!

### Setup SSL Certificate (HTTPS)

1. In cPanel, go to **Security** → **SSL/TLS Status**
2. Find your domain and click **"Run AutoSSL"**
3. Wait for certificate installation
4. Update your `.env` URLs to use `https://`

### Configure Cron Job for Archiving (Optional)

The archiving service runs automatically within the app, but you can also set up a cron job as backup:

1. In cPanel, go to **Advanced** → **Cron Jobs**
2. Add a new cron job:
   - **Minute**: `*/5` (every 5 minutes)
   - **Command**: `cd ~/tutoring-tool && node -e "require('./backend/dist/services/ArchivingService').default.runArchiving()"`

## Updating Your Application

When you make changes to your code:

1. **Build locally:**
   ```bash
   npm run build:production
   ```

2. **Upload changed files** via File Manager or FTP

3. **Restart the app** in cPanel → Setup Node.js App → Restart

**For automatic updates with Git:**
1. Push changes to your Git repository
2. In cPanel → Git Version Control → Pull or Deploy
3. Restart the Node.js app

## Monitoring and Troubleshooting

### View Application Logs

1. In cPanel, go to **Setup Node.js App**
2. Click on your application
3. View **Error Log** and **Access Log**

Or via File Manager:
- Navigate to `logs/` directory in your application root
- Download and view `passenger.log`

### Common Issues

**"Application Failed to Start"**
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check error logs for specific errors

**"Cannot connect to database"**
- Verify MongoDB Atlas network access allows connections from anywhere (0.0.0.0/0)
- Check database username and password
- Ensure connection string format is correct

**"502 Bad Gateway" or "Application Unavailable"**
- Application might have crashed - check error logs
- Restart the application
- Verify Node.js version compatibility

**"Port already in use"**
- cPanel might assign a different port - check app settings
- Update PORT environment variable if needed

**File Upload Not Working**
- Check `backend/uploads` directory exists
- Verify directory permissions (755)
- Check file size limits in cPanel

**Voice/OCR Features Not Working**
- These features run in the browser, not server
- Ensure HTTPS is enabled (required for microphone access)
- Check browser compatibility

### Performance Optimization

1. **Enable Gzip Compression** in cPanel → Software → Optimize Website
2. **Enable Browser Caching** via .htaccess
3. **Monitor Resource Usage** in cPanel → Metrics → CPU and Concurrent Connection Usage
4. **Upgrade Hosting Plan** if you exceed shared hosting limits

## Scaling Considerations

Namecheap Stellar shared hosting is suitable for:
- Small to medium tutoring sessions (up to 50 concurrent users)
- Development and testing
- Small educational institutions

For larger deployments, consider:
- **Namecheap VPS** for dedicated resources
- **Cloud platforms** (AWS, DigitalOcean, Heroku)
- **Container deployment** with Docker

## Security Best Practices

1. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

2. **Use strong JWT secret** (at least 32 random characters)

3. **Enable HTTPS** with SSL certificate

4. **Restrict MongoDB Atlas network access** to your server IP (more secure than 0.0.0.0/0)

5. **Regular backups:**
   - Export MongoDB data from Atlas dashboard
   - Backup uploaded files from `backend/uploads`

6. **Monitor logs** for suspicious activity

## Support and Resources

- **Namecheap Support**: https://www.namecheap.com/support/
- **Node.js Documentation**: https://nodejs.org/docs/
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Tutoring Tool Local Setup**: See [QUICKSTART.md](QUICKSTART.md)

## Troubleshooting Checklist

Before contacting support, verify:

- [ ] MongoDB Atlas is accessible (test connection locally first)
- [ ] All environment variables are set correctly
- [ ] Node.js version is 16.x or higher
- [ ] All dependencies installed successfully
- [ ] Application builds without errors locally
- [ ] Uploads directory exists and has correct permissions
- [ ] Domain DNS is properly configured
- [ ] SSL certificate is installed
- [ ] Error logs checked for specific error messages

---

**Congratulations!** Your Tutoring Tool should now be deployed and accessible on Namecheap Stellar hosting.

For local development, refer to [QUICKSTART.md](QUICKSTART.md).
