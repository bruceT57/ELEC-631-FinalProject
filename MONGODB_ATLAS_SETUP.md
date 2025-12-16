# MongoDB Atlas Setup Guide

Since Namecheap Stellar shared hosting doesn't include MongoDB, you'll need to use MongoDB Atlas (free tier available).

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a Cluster

1. After logging in, click **"Build a Database"** or **"Create"**
2. Choose **"M0 FREE"** tier
3. Select a cloud provider and region (choose one close to your users)
4. Click **"Create Cluster"** (this may take 1-3 minutes)

## Step 3: Create Database User

1. In the left sidebar, click **"Database Access"** under SECURITY
2. Click **"Add New Database User"**
3. Select **"Password"** authentication method
4. Enter username (e.g., `tutoring-admin`)
5. Click **"Autogenerate Secure Password"** and copy it (save it somewhere safe!)
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Configure Network Access

1. In the left sidebar, click **"Network Access"** under SECURITY
2. Click **"Add IP Address"**
3. Choose one of these options:
   - **Option A (Recommended for development)**: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - **Option B (More secure)**: Add your Namecheap server IP address
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** button on your cluster
3. Select **"Connect your application"**
4. Choose **"Node.js"** as driver and version **5.5 or later**
5. Copy the connection string - it will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Configure Connection String

1. Replace `<username>` with your database username
2. Replace `<password>` with your database password (the one you copied earlier)
3. Add your database name after `.net/` (e.g., `tutoring-tool`)

**Final connection string example:**
```
mongodb+srv://tutoring-admin:YourPassword123@cluster0.xxxxx.mongodb.net/tutoring-tool?retryWrites=true&w=majority
```

## Step 7: Update Environment Variables

Add this connection string to your `.env` file:

```env
MONGODB_URI=mongodb+srv://tutoring-admin:YourPassword123@cluster0.xxxxx.mongodb.net/tutoring-tool?retryWrites=true&w=majority
```

## Testing Connection

Before deploying, test your connection locally:

1. Update your local `.env` file with the MongoDB Atlas connection string
2. Run your backend: `npm run dev:backend`
3. If you see "✓ Database: Connected", it's working!

## MongoDB Atlas Free Tier Limits

- **Storage**: 512 MB
- **RAM**: Shared
- **vCPU**: Shared
- **Connections**: 500 concurrent
- **Backups**: Not included (manual exports available)

This is sufficient for development and small-scale production use.

## Troubleshooting

**Cannot connect:**
- Verify network access allows your IP
- Check username and password are correct
- Ensure connection string format is correct

**Connection timeout:**
- Network Access might not be configured
- Try "Allow Access from Anywhere" for testing

**Authentication failed:**
- Double-check database user credentials
- Password might contain special characters that need URL encoding

## Next Steps

Once your MongoDB Atlas cluster is set up:
1. Update `.env.production` with your connection string
2. Proceed with Namecheap deployment
3. Monitor your database usage in MongoDB Atlas dashboard
