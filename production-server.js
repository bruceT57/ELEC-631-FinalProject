/**
 * Production Server for Namecheap Stellar Hosting
 * This file combines backend API and frontend static serving
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Import backend app configuration
const Database = require('./backend/dist/config/database').default;

// Import routes
const authRoutes = require('./backend/dist/routes/auth').default;
const spaceRoutes = require('./backend/dist/routes/spaces').default;
const postRoutes = require('./backend/dist/routes/posts').default;
const archiveRoutes = require('./backend/dist/routes/archives').default;

// Import archiving service
const archivingService = require('./backend/dist/services/ArchivingService').default;

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const config = {
  port: PORT,
  nodeEnv: process.env.NODE_ENV || 'production',
  mongodbUri: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL || `http://localhost:${PORT}`,
};

// ========== Middleware ==========

// CORS - Allow frontend to access API
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Static files for uploads
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ========== API Routes ==========

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Debug echo
app.post('/api/debug/echo', (req, res) => {
  res.status(200).json({ headers: req.headers, body: req.body });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/archives', archiveRoutes);

// ========== Serve Frontend Static Files ==========

// Serve static files from frontend build
const frontendBuildPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendBuildPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// ========== Error Handling ==========

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

// ========== Start Server ==========

async function startServer() {
  try {
    console.log('Starting Tutoring Tool Server...');
    console.log('Environment:', config.nodeEnv);

    // Validate MongoDB URI
    if (!config.mongodbUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    // Connect to database
    await Database.connect();
    console.log('✓ Database connected');

    // Start archiving service
    if (archivingService && archivingService.start) {
      archivingService.start();
      console.log('✓ Archiving service started');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(60));
      console.log(`✓ Tutoring Tool Server running on port ${PORT}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ Database: Connected to MongoDB`);
      console.log(`✓ Frontend: Serving from ${frontendBuildPath}`);
      console.log(`✓ Archiving: Active`);
      console.log('='.repeat(60));
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\nShutting down gracefully...');
  try {
    if (archivingService && archivingService.stop) {
      archivingService.stop();
    }
    await Database.disconnect();
    console.log('✓ Server shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

module.exports = app;
