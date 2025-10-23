import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuration class for application settings
 */
class Config {
  public readonly port: number;
  public readonly mongoUri: string;
  public readonly jwtSecret: string;
  public readonly jwtExpiresIn: string;
  public readonly openaiApiKey: string;
  public readonly nodeEnv: string;
  public readonly gatewayUrl: string;
  public readonly frontendUrl: string;

  constructor() {
    this.port = parseInt(process.env.PORT || '5000', 10);
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoring-tool';
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Validate that all required configuration is present
   */
  public validate(): void {
    if (!this.jwtSecret || this.jwtSecret === 'default-secret-change-in-production') {
      console.warn('Warning: Using default JWT secret. Please set JWT_SECRET in production!');
    }

    if (!this.openaiApiKey) {
      console.warn('Warning: OpenAI API key not set. AI ranking features will not work.');
    }
  }
}

export default new Config();
