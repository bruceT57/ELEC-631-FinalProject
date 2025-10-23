import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models';
import config from '../config/config';

/**
 * Token payload interface
 */
export interface ITokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Registration data interface
 */
export interface IRegistrationData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * Authentication Service class
 */
class AuthService {
  /**
   * Register a new user
   */
  public async register(data: IRegistrationData): Promise<{ user: IUser; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }]
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Create new user
    const user = new User(data);
    await user.save();

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Login user
   */
  public async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Generate JWT token
   */
  public generateToken(user: IUser): string {
    const payload: ITokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    });
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): ITokenPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as ITokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select('-password');
  }

  /**
   * Update user profile
   */
  public async updateProfile(
    userId: string,
    updates: Partial<IUser>
  ): Promise<IUser | null> {
    // Remove sensitive fields from updates
    delete (updates as any).password;
    delete (updates as any).role;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    return user;
  }

  /**
   * Change password
   */
  public async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await user.comparePassword(oldPassword);

    if (!isPasswordValid) {
      throw new Error('Invalid old password');
    }

    user.password = newPassword;
    await user.save();
  }
}

export default new AuthService();
