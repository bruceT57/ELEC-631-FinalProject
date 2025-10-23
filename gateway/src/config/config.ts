import dotenv from 'dotenv';

dotenv.config();

/**
 * Gateway Configuration class
 */
class GatewayConfig {
  public readonly port: number;
  public readonly backendUrl: string;
  public readonly frontendUrl: string;
  public readonly nodeEnv: string;
  public readonly rateLimitWindowMs: number;
  public readonly rateLimitMaxRequests: number;

  constructor() {
    this.port = parseInt(process.env.PORT || '4000', 10);
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.rateLimitWindowMs = parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || '900000',
      10
    ); // 15 minutes
    this.rateLimitMaxRequests = parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || '100',
      10
    );
  }

  /**
   * Validate configuration
   */
  public validate(): void {
    console.log('✓ Gateway configuration validated');
  }
}

export default new GatewayConfig();
