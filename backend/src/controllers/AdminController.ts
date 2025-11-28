import { Request, Response } from 'express';
import { TutorCode, User } from '../models';
import crypto from 'crypto';

class AdminController {
  public async generateTutorCode(req: Request & { user?: any }, res: Response) {
    try {
      const count = parseInt(req.body.count) || 1;
      const createdCodes = [];

      for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        createdCodes.push({
          code,
          createdBy: req.user.userId
        });
      }
      
      const tutorCodes = await TutorCode.insertMany(createdCodes);

      res.status(201).json({ codes: tutorCodes });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to generate tutor code' });
    }
  }

  public async getTutorCodes(req: Request, res: Response) {
    try {
      const codes = await TutorCode.find()
        .populate('usedBy', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 });
      
      res.json({ codes });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch tutor codes' });
    }
  }

  public async getTutors(req: Request, res: Response) {
    try {
      const tutors = await User.find({ role: 'tutor' })
        .select('-password')
        .sort({ createdAt: -1 });
      res.json({ tutors });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch tutors' });
    }
  }

  public async toggleUserStatus(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update user status' });
    }
  }

  public async deleteUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete user' });
    }
  }

  public async deleteTutorCode(req: Request, res: Response) {
    try {
      const { codeId } = req.params;
      const code = await TutorCode.findByIdAndDelete(codeId);

      if (!code) {
        return res.status(404).json({ error: 'Tutor code not found' });
      }

      res.json({ message: 'Tutor code deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete tutor code' });
    }
  }

  public async bulkDeleteTutorCodes(req: Request, res: Response) {
    try {
      const { codeIds } = req.body;
      if (!Array.isArray(codeIds) || codeIds.length === 0) {
        return res.status(400).json({ error: 'No codes provided for deletion' });
      }

      const result = await TutorCode.deleteMany({ _id: { $in: codeIds } });

      res.json({ 
        message: 'Tutor codes deleted successfully', 
        deletedCount: result.deletedCount 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete tutor codes' });
    }
  }
}

export default new AdminController();
