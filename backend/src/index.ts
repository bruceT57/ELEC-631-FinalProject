import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import Database from './config/database';
import config from './config/config';
import ArchivingService from './services/ArchivingService';

// Import routes
import authRoutes from './routes/auth';
import spaceRoutes from './routes/spaces';
import postRoutes from './routes/posts';
import archiveRoutes from './routes/archives';

/**
 * Main Application class
 */
class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // CORS
    this.app.use(
      cors({
        origin: [config.frontendUrl, config.gatewayUrl],
        credentials: true
      })
    );

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files for uploads
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/spaces', spaceRoutes);
    this.app.use('/api/posts', postRoutes);
    this.app.use('/api/archives', archiveRoutes);

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err);

      res.status(500).json({
        error: err.message || 'Internal server error',
        ...(config.nodeEnv === 'development' && { stack: err.stack })
      });
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Validate configuration
      config.validate();

      // Connect to database
      await Database.connect();

      // Create uploads directory if it doesn't exist
      const fs = require('fs');
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Start archiving service
      ArchivingService.start();

      // Start server
      this.app.listen(config.port, () => {
        console.log('');
        console.log('='.repeat(50));
        console.log(`✓ Server running on http://localhost:${config.port}`);
        console.log(`✓ Environment: ${config.nodeEnv}`);
        console.log(`✓ Database: Connected`);
        console.log(`✓ Archiving: Active`);
        console.log('='.repeat(50));
        console.log('');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('\nShutting down gracefully...');

    try {
      ArchivingService.stop();
      await Database.disconnect();
      console.log('✓ Server shut down successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Create and start application
const application = new App();

// Handle shutdown signals
process.on('SIGINT', () => application.shutdown());
process.on('SIGTERM', () => application.shutdown());

// Start server
application.start();

export default application.app;
