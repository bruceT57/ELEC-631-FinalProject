import { Response } from 'express';
import ArchivingService from '../services/ArchivingService';
import { AuthRequest } from '../middleware/auth';

/**
 * Archiving Controller class
 */
class ArchivingController {
  /**
   * Get archived spaces
   */
  public async getArchivedSpaces(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { role, userId } = req.user;

      // Tutors see only their archived spaces, admins see all
      const tutorId = role === 'tutor' ? userId : undefined;

      const archivedSpaces = await ArchivingService.getArchivedSpaces(tutorId);

      res.status(200).json({ archivedSpaces });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get archived spaces'
      });
    }
  }

  /**
   * Get archived space details
   */
  public async getArchivedSpaceDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { sessionId } = req.params;

      const details = await ArchivingService.getArchivedSpaceDetails(sessionId);

      res.status(200).json(details);
    } catch (error: any) {
      res.status(404).json({
        error: error.message || 'Archived space not found'
      });
    }
  }

  /**
   * Manually archive a space
   */
  public async manualArchive(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { spaceId } = req.params;

      await ArchivingService.manualArchive(spaceId, req.user.userId);

      res.status(200).json({
        message: 'Space archived successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to archive space'
      });
    }
  }

  /**
   * Trigger archiving of all expired spaces (Admin only)
   */
  public async triggerArchiving(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await ArchivingService.archiveExpiredSpaces();

      res.status(200).json({
        message: `Archived ${count} expired space(s)`,
        count
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to trigger archiving'
      });
    }
  }
}

export default new ArchivingController();
