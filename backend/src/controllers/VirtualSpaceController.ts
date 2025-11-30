import { Response } from 'express';
import VirtualSpaceService, { IVirtualSpaceData } from '../services/VirtualSpaceService';
import { AuthRequest } from '../middleware/auth';
import { SpaceStatus } from '../models';

/**
 * VirtualSpace Controller class
 */
class VirtualSpaceController {
  /**
   * Create a new virtual space (Tutor only)
   */
  public async createSpace(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const spaceData: IVirtualSpaceData = {
        ...req.body,
        tutorId: req.user.userId
      };

      const space = await VirtualSpaceService.createSpace(spaceData);

      res.status(201).json({
        message: 'Virtual space created successfully',
        space
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to create virtual space'
      });
    }
  }

  /**
   * Get space by code
   */
  public async getSpaceByCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const space = await VirtualSpaceService.getSpaceByCode(code);

      if (!space) {
        res.status(404).json({ error: 'Virtual space not found' });
        return;
      }

      res.status(200).json({ space });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get virtual space'
      });
    }
  }

  /**
   * Join a virtual space (Student - deprecated, kept for backward compatibility)
   */
  public async joinSpace(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { code } = req.params;

      const space = await VirtualSpaceService.joinSpace(code, req.user.userId);

      res.status(200).json({
        message: 'Successfully joined virtual space',
        space
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to join virtual space'
      });
    }
  }

  /**
   * Join a virtual space anonymously (No authentication required)
   * Students provide only nickname and email
   */
  public async joinSpaceAnonymous(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      const { nickname, email } = req.body;

      // Validate inputs
      if (!nickname || !nickname.trim()) {
        res.status(400).json({ error: 'Nickname is required' });
        return;
      }

      if (!email || !email.trim()) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Find space by code
      const space = await VirtualSpaceService.getSpaceByCode(code);
      if (!space) {
        res.status(404).json({ error: 'Virtual space not found' });
        return;
      }

      // Check if space is active
      if (space.status !== SpaceStatus.ACTIVE) {
        res.status(400).json({ error: 'This session is not currently active' });
        return;
      }

      // Create or find participant
      const StudentParticipant = (await import('../models/StudentParticipant')).default;
      const crypto = require('crypto');

      let participant = await StudentParticipant.findOne({
        spaceId: space._id,
        email: email.toLowerCase().trim()
      });

      if (participant) {
        // Update nickname if changed
        participant.nickname = nickname.trim();
        await participant.save();
      } else {
        // Create new participant
        const sessionToken = crypto.randomBytes(32).toString('hex');
        participant = await StudentParticipant.create({
          spaceId: space._id,
          nickname: nickname.trim(),
          email: email.toLowerCase().trim(),
          sessionToken
        });
      }

      res.status(200).json({
        participantId: String(participant._id),
        sessionToken: participant.sessionToken,
        space
      });
    } catch (error: any) {
      console.error('Error in joinSpaceAnonymous:', error);
      res.status(500).json({
        error: error.message || 'Failed to join space'
      });
    }
  }

  /**
   * Get tutor's spaces
   */
  public async getTutorSpaces(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { status } = req.query;

      const spaces = await VirtualSpaceService.getSpacesByTutor(
        req.user.userId,
        status as SpaceStatus
      );

      res.status(200).json({ spaces });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get spaces'
      });
    }
  }

  /**
   * Get student's spaces
   */
  public async getStudentSpaces(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const spaces = await VirtualSpaceService.getSpacesByParticipant(req.user.userId);

      res.status(200).json({ spaces });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get spaces'
      });
    }
  }

  /**
   * Get space details by ID
   */
  public async getSpaceById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const space = await VirtualSpaceService.getSpaceById(id);

      if (!space) {
        res.status(404).json({ error: 'Virtual space not found' });
        return;
      }

      res.status(200).json({ space });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get virtual space'
      });
    }
  }

  /**
   * Update space status
   */
  public async updateSpaceStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { status } = req.body;

      const space = await VirtualSpaceService.updateSpaceStatus(id, status);

      if (!space) {
        res.status(404).json({ error: 'Virtual space not found' });
        return;
      }

      res.status(200).json({
        message: 'Space status updated successfully',
        space
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update space status'
      });
    }
  }

  /**
   * Get participants in a space
   */
  public async getParticipants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const participants = await VirtualSpaceService.getParticipants(id);

      res.status(200).json({ participants });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get participants'
      });
    }
  }

  /**
   * Generate AI session summary
   */
  public async generateSessionSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const summary = await VirtualSpaceService.generateSessionSummary(id);

      res.status(200).json({ summary });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to generate session summary'
      });
    }
  }

  /**
   * Delete a space
   */
  public async deleteSpace(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await VirtualSpaceService.deleteSpace(id);

      res.status(200).json({
        message: 'Space deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to delete space'
      });
    }
  }
}

export default new VirtualSpaceController();
