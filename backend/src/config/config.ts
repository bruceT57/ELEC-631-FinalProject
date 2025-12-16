import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

/**
 * Get the local IP address of the machine
 */
function getLocalIpAddress(): string {
<<<<<<< HEAD
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaces = interfaces[name];
    if (ifaces) {
      for (const iface of ifaces) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Found local IP: ${iface.address} (interface: ${name})`);
          return iface.address;
        }
      }
    }
=======
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const ifaces = interfaces[name];
      if (ifaces) {
        for (const iface of ifaces) {
          // Skip internal and non-IPv4 addresses
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`Found local IP: ${iface.address} (interface: ${name})`);
            return iface.address;
          }
        }
      }
    }
  } catch (error) {
    console.warn('Error detecting network interfaces:', error);
>>>>>>> ai_feature_clean
  }
  console.warn('Could not detect local IP, falling back to localhost');
  return 'localhost';
}

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
  public frontendUrl: string; // Changed to public (non-readonly) so it can be updated
  public readonly localIpAddress: string;

  constructor() {
<<<<<<< HEAD
    this.port = parseInt(process.env.PORT || '5000', 10);
=======
    this.port = parseInt(process.env.PORT || '5001', 10);
>>>>>>> ai_feature_clean
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoring-tool';
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:4000';
    this.localIpAddress = getLocalIpAddress();
    // Use IP-based URL for QR codes, unless explicitly set via environment
    const defaultFrontendUrl = `http://${this.localIpAddress}:3001`;
    this.frontendUrl = process.env.FRONTEND_URL || defaultFrontendUrl;
  }

  /**
   * Validate that all required configuration is present
   */
  public validate(): void {
    // Recalculate frontendUrl if using default
    const isUsingDefaultFrontendUrl = !process.env.FRONTEND_URL;
    if (isUsingDefaultFrontendUrl) {
      this.frontendUrl = `http://${this.localIpAddress}:3001`;
    }
<<<<<<< HEAD
    
    console.log(`✓ Frontend URL (for QR codes): ${this.frontendUrl}`);
    console.log(`✓ Local IP Address: ${this.localIpAddress}`);
    
=======

    console.log(`✓ Frontend URL (for QR codes): ${this.frontendUrl}`);
    console.log(`✓ Local IP Address: ${this.localIpAddress}`);

>>>>>>> ai_feature_clean
    if (!this.jwtSecret || this.jwtSecret === 'default-secret-change-in-production') {
      console.warn('Warning: Using default JWT secret. Please set JWT_SECRET in production!');
    }

    if (!this.openaiApiKey) {
      console.warn('Warning: OpenAI API key not set. AI ranking features will not work.');
    }
  }
}

export default new Config();
