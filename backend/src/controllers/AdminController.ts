import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, UserRole } from '../models';
import bcrypt from 'bcryptjs';

/**
 * Admin Controller class
 * Handles admin-specific operations like user management
 */
class AdminController {
  /**
   * Get all users (Tutors and Admins)
   */
  public async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const users = await User.find({
        role: { $in: [UserRole.TUTOR, UserRole.ADMIN] }
      })
        .select('-password')
        .sort({ createdAt: -1 });

      res.status(200).json({ users });
    } catch (error: any) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({
        error: error.message || 'Failed to get users'
      });
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const user = await User.findById(id).select('-password');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({ user });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get user'
      });
    }
  }

  /**
   * Create a new user (Tutor or Admin)
   */
  public async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { username, email, password, firstName, lastName, role } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName || !role) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Validate role
      if (role !== UserRole.TUTOR && role !== UserRole.ADMIN) {
        res.status(400).json({ error: 'Role must be either tutor or admin' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }]
      });

      if (existingUser) {
        res.status(400).json({ error: 'User with this email or username already exists' });
        return;
      }

      // Create new user
      const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        role
      });

      // Return user without password
      const userResponse: any = user.toObject();
      delete userResponse.password;

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } catch (error: any) {
      console.error('Error in createUser:', error);
      res.status(400).json({
        error: error.message || 'Failed to create user'
      });
    }
  }

  /**
   * Update user details
   */
  public async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { username, email, firstName, lastName, role } = req.body;

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update fields if provided
      if (username) user.username = username.toLowerCase();
      if (email) user.email = email.toLowerCase();
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (role && (role === UserRole.TUTOR || role === UserRole.ADMIN)) {
        user.role = role;
      }

      await user.save();

      // Return user without password
      const userResponse: any = user.toObject();
      delete userResponse.password;

      res.status(200).json({
        message: 'User updated successfully',
        user: userResponse
      });
    } catch (error: any) {
      console.error('Error in updateUser:', error);
      res.status(400).json({
        error: error.message || 'Failed to update user'
      });
    }
  }

  /**
   * Delete user
   */
  public async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === req.user.userId) {
        res.status(400).json({ error: 'You cannot delete your own account' });
        return;
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      res.status(500).json({
        error: error.message || 'Failed to delete user'
      });
    }
  }

  /**
   * Reset user password
   */
  public async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      const user = await User.findById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        message: 'Password reset successfully'
      });
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      res.status(500).json({
        error: error.message || 'Failed to reset password'
      });
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const totalUsers = await User.countDocuments({
        role: { $in: [UserRole.TUTOR, UserRole.ADMIN] }
      });

      const tutorCount = await User.countDocuments({ role: UserRole.TUTOR });
      const adminCount = await User.countDocuments({ role: UserRole.ADMIN });

      const recentUsers = await User.find({
        role: { $in: [UserRole.TUTOR, UserRole.ADMIN] }
      })
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(5);

      res.status(200).json({
        statistics: {
          total: totalUsers,
          tutors: tutorCount,
          admins: adminCount,
          recentUsers
        }
      });
    } catch (error: any) {
      console.error('Error in getUserStatistics:', error);
      res.status(500).json({
        error: error.message || 'Failed to get user statistics'
      });
    }
  }
}

export default new AdminController();
