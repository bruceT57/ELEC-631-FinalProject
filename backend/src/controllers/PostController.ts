import { Response } from 'express';
import PostService, { IPostData } from '../services/PostService';
import { AuthRequest } from '../middleware/auth';
import { InputType } from '../models';

/**
 * Post Controller class
 */
class PostController {
  /**
   * Create a new post
   * Supports both authenticated users and anonymous students
   */
  public async createPost(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { spaceId, question, inputType, originalText, participantId, sessionToken } = req.body;

      if (!spaceId || !question || !inputType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      let studentId: string;
      let studentNickname: string;

      // Check if anonymous student
      if (participantId && sessionToken) {
        // Verify session token
        const StudentParticipant = (await import('../models/StudentParticipant')).default;
        const participant = await StudentParticipant.findOne({
          _id: participantId,
          sessionToken,
          spaceId
        });

        if (!participant) {
          res.status(401).json({ error: 'Invalid session' });
          return;
        }

        studentId = String(participant._id);
        studentNickname = participant.nickname;
      } else if (req.user) {
        // Authenticated user (tutor/admin posting on behalf, or legacy student)
        studentId = req.user.userId;
        const User = (await import('../models/User')).default;
        const user = await User.findById(studentId);
        if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        studentNickname = `${user.firstName} ${user.lastName}`;
      } else {
        res.status(401).json({ error: 'Unauthorized - Please provide session credentials or login' });
        return;
      }

      const postData: IPostData = {
        spaceId,
        studentId,
        studentNickname,
        question,
        inputType,
        originalText,
        mediaAttachments: []
      };

      // Handle file uploads if any
      if (req.files && Array.isArray(req.files)) {
        postData.mediaAttachments = req.files.map((file: any) => ({
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
          originalName: file.originalname
        }));
      }

      const post = await PostService.createPost(postData);

      res.status(201).json({
        message: 'Post created successfully',
        post
      });
    } catch (error: any) {
      console.error('Error in createPost:', error);
      res.status(400).json({
        error: error.message || 'Failed to create post'
      });
    }
  }

  /**
   * Get posts by space
   */
  public async getPostsBySpace(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { spaceId } = req.params;
      const { sortBy } = req.query;

      const posts = await PostService.getPostsBySpace(
        spaceId,
        sortBy as 'difficulty' | 'time'
      );

      res.status(200).json({ posts });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get posts'
      });
    }
  }

  /**
   * Get student's posts
   */
  public async getStudentPosts(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const posts = await PostService.getPostsByStudent(req.user.userId);

      res.status(200).json({ posts });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get posts'
      });
    }
  }

  /**
   * Get post by ID
   */
  public async getPostById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const post = await PostService.getPostById(id);

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      res.status(200).json({ post });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get post'
      });
    }
  }

  /**
   * Answer a post (Tutor)
   */
  public async answerPost(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { response } = req.body;

      if (!response) {
        res.status(400).json({ error: 'Response is required' });
        return;
      }

      const post = await PostService.answerPost(id, req.user.userId, response);

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      res.status(200).json({
        message: 'Post answered successfully',
        post
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to answer post'
      });
    }
  }

  /**
   * Update a post
   */
  public async updatePost(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      const post = await PostService.updatePost(id, updates);

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      res.status(200).json({
        message: 'Post updated successfully',
        post
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to update post'
      });
    }
  }

  /**
   * Delete a post
   */
  public async deletePost(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      await PostService.deletePost(id);

      res.status(200).json({
        message: 'Post deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to delete post'
      });
    }
  }

  /**
   * Get unanswered posts in a space
   */
  public async getUnansweredPosts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { spaceId } = req.params;

      const posts = await PostService.getUnansweredPosts(spaceId);

      res.status(200).json({ posts });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get unanswered posts'
      });
    }
  }

  /**
   * Get knowledge summary for a space
   */
  public async getKnowledgeSummary(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { spaceId } = req.params;

      const summary = await PostService.getKnowledgeSummary(spaceId);

      res.status(200).json({ summary });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get knowledge summary'
      });
    }
  }

  /**
   * Get post statistics for a space
   */
  public async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { spaceId } = req.params;

      const statistics = await PostService.getPostStatistics(spaceId);

      res.status(200).json({ statistics });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || 'Failed to get statistics'
      });
    }
  }

  /**
   * Add a student comment to a post (Anonymous students only)
   * Allows students in the same virtual space to respond to each other
   */
  public async addStudentComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params; // Post ID
      const { comment, participantId, sessionToken } = req.body;

      if (!comment || !comment.trim()) {
        res.status(400).json({ error: 'Comment is required' });
        return;
      }

      if (!participantId || !sessionToken) {
        res.status(400).json({ error: 'Anonymous session required' });
        return;
      }

      // Get the post to verify it exists and get the spaceId
      const Post = (await import('../models/Post')).default;
      const post = await Post.findById(id);

      if (!post) {
        res.status(404).json({ error: 'Post not found' });
        return;
      }

      // Verify session token and ensure student is in the same space
      const StudentParticipant = (await import('../models/StudentParticipant')).default;
      const participant = await StudentParticipant.findOne({
        _id: participantId,
        sessionToken,
        spaceId: post.spaceId
      });

      if (!participant) {
        res.status(401).json({ error: 'Invalid session or not authorized for this space' });
        return;
      }

      // Add the comment
      post.addStudentComment(
        participant._id as any,
        participant.nickname,
        comment.trim()
      );

      await post.save();

      res.status(200).json({
        message: 'Comment added successfully',
        post
      });
    } catch (error: any) {
      console.error('Error in addStudentComment:', error);
      res.status(400).json({
        error: error.message || 'Failed to add comment'
      });
    }
  }
}

export default new PostController();
