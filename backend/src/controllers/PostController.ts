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

  /**
   * Add a reply to a post
   */
  public async addReply(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { postId } = req.params;
      const { content } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
      }

      const post = await PostService.addReply(postId, req.user.userId, content);

      res.status(200).json({
        message: 'Reply added successfully',
        post
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to add reply'
      });
    }
  }

  /**
   * Toggle like on a post
   */
  public async toggleLike(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { postId } = req.params;

      const post = await PostService.toggleLike(postId, req.user.userId);

      res.status(200).json({
        message: 'Like toggled successfully',
        post
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to toggle like'
      });
    }
  }

  /**
   * Toggle like on a reply
   */
  public async toggleReplyLike(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { postId, replyId } = req.params;

      const post = await PostService.toggleReplyLike(postId, replyId, req.user.userId);

      res.status(200).json({
        message: 'Reply like toggled successfully',
        post
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Failed to toggle reply like'
      });
    }
  }
}

export default new PostController();
