import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from './config/config';
import { rateLimiter, authRateLimiter } from './middleware/rateLimiter';

/**
 * API Gateway Application class
 */
class Gateway {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeProxies();
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
        origin: config.frontendUrl,
        credentials: true
      })
    );

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path} - Gateway`);
      next();
    });

    // Apply general rate limiting
    this.app.use('/api/', rateLimiter);
  }

  /**
   * Initialize proxy routes
   */
  private initializeProxies(): void {
    // Proxy authentication requests with stricter rate limiting
    this.app.use(
      '/api/auth',
      authRateLimiter,
      createProxyMiddleware({
        target: config.backendUrl,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
          console.log(`Proxying to backend: ${req.method} ${req.path}`);
        },
        onError: (err, req, res) => {
          console.error('Proxy error:', err);
          (res as Response).status(500).json({
            error: 'Gateway error: Unable to reach backend service'
          });
        }
      })
    );

    // Proxy all other API requests
    this.app.use(
      '/api',
      createProxyMiddleware({
        target: config.backendUrl,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
          console.log(`Proxying to backend: ${req.method} ${req.path}`);
        },
        onError: (err, req, res) => {
          console.error('Proxy error:', err);
          (res as Response).status(500).json({
            error: 'Gateway error: Unable to reach backend service'
          });
        }
      })
    );
  }

  /**
   * Initialize direct routes
   */
  private initializeRoutes(): void {
    // Gateway health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        service: 'API Gateway',
        timestamp: new Date().toISOString()
      });
    });

    // Gateway info
    this.app.get('/info', (req: Request, res: Response) => {
      res.status(200).json({
        service: 'Tutoring Tool API Gateway',
        version: '1.0.0',
        environment: config.nodeEnv,
        backendUrl: config.backendUrl
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Gateway: Route not found',
        path: req.path
      });
    });
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Gateway Error:', err);

      res.status(500).json({
        error: 'Gateway internal error',
        message: err.message,
        ...(config.nodeEnv === 'development' && { stack: err.stack })
      });
    });
  }

  /**
   * Start the gateway
   */
  public start(): void {
    config.validate();

    this.app.listen(config.port, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`✓ API Gateway running on http://localhost:${config.port}`);
      console.log(`✓ Proxying to backend: ${config.backendUrl}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ Rate limiting: Active`);
      console.log('='.repeat(50));
      console.log('');
    });
  }
}

// Create and start gateway
const gateway = new Gateway();
gateway.start();

export default gateway.app;
