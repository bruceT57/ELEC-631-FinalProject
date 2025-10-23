import { Request, Response } from 'express';
import AuthService, { IRegistrationData } from '../services/AuthService';
import { AuthRequest } from '../middleware/auth';

/**
 * Authentication Controller class
 */
class AuthController {
  /**
   * Register new user
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const registrationData: IRegistrationData = req.body;

      const { user, token } = await AuthService.register(registrationData);

      res.status(201).json({
        message: 'User registered successfully',
        user: user.getPublicProfile(),
        token
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Registration failed'
      });
    }
  }

  /**
   * Login user
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const { user, token } = await AuthService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        user: user.getPublicProfile(),
        token
      });
    } catch (error: any) {
      res.status(401).json({
        error: error.message || 'Login failed'
      });
    }
  }

  /**
   * Get current user profile
   */
  public async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await AuthService.getUserById(req.user.userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        user: user.getPublicProfile()
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get profile'
      });
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updates = req.body;
      const user = await AuthService.updateProfile(req.user.userId, updates);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: user.getPublicProfile()
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update profile'
      });
    }
  }

  /**
   * Change password
   */
  public async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        res.status(400).json({ error: 'Old and new passwords are required' });
        return;
      }

      await AuthService.changePassword(req.user.userId, oldPassword, newPassword);

      res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to change password'
      });
    }
  }
}

export default new AuthController();
