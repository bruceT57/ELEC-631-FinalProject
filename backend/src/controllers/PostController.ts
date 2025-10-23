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
   */
  public async createPost(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { spaceId, question, inputType, originalText } = req.body;

      if (!spaceId || !question || !inputType) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const postData: IPostData = {
        spaceId,
        studentId: req.user.userId,
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
}

export default new PostController();
