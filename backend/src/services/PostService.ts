import { Post, IPost, InputType, DifficultyLevel } from '../models';
import AIRankingService from './AIRankingService';
import mongoose from 'mongoose';

/**
 * Post creation data interface
 */
export interface IPostData {
  spaceId: string;
  studentId: string;
  question: string;
  inputType: InputType;
  originalText?: string;
  mediaAttachments?: Array<{
    url: string;
    type: string;
    originalName: string;
  }>;
}

/**
 * Post Service class
 */
class PostService {
  /**
   * Create a new post
   */
  public async createPost(data: IPostData): Promise<IPost> {
    // Create post
    const post = new Post({
      ...data,
      difficultyLevel: DifficultyLevel.UNRANKED,
      difficultyScore: 0,
      knowledgePoints: [],
      isAnswered: false
    });

    await post.save();

    // Analyze question in background (don't wait)
    this.analyzePostInBackground(post._id.toString(), data.question);

    return post;
  }

  /**
   * Analyze post difficulty in background
   */
  private async analyzePostInBackground(postId: string, question: string): Promise<void> {
    try {
      const analysis = await AIRankingService.analyzeQuestion(question);

      await Post.findByIdAndUpdate(postId, {
        difficultyLevel: analysis.difficultyLevel,
        difficultyScore: analysis.difficultyScore,
        knowledgePoints: analysis.knowledgePoints
      });
    } catch (error) {
      console.error('Failed to analyze post:', error);
    }
  }

  /**
   * Get posts by space ID, sorted by difficulty
   */
  public async getPostsBySpace(
    spaceId: string,
    sortBy: 'difficulty' | 'time' = 'difficulty'
  ): Promise<IPost[]> {
    const sortOption = sortBy === 'difficulty' ? { difficultyScore: -1 } : { createdAt: -1 };

    return Post.find({ spaceId })
      .populate('studentId', '-password')
      .populate('answeredBy', '-password')
      .sort(sortOption);
  }

  /**
   * Get posts by student
   */
  public async getPostsByStudent(studentId: string): Promise<IPost[]> {
    return Post.find({ studentId })
      .populate('spaceId')
      .populate('answeredBy', '-password')
      .sort({ createdAt: -1 });
  }

  /**
   * Get post by ID
   */
  public async getPostById(postId: string): Promise<IPost | null> {
    return Post.findById(postId)
      .populate('studentId', '-password')
      .populate('answeredBy', '-password')
      .populate('spaceId');
  }

  /**
   * Answer a post (Tutor)
   */
  public async answerPost(
    postId: string,
    tutorId: string,
    response: string
  ): Promise<IPost | null> {
    const post = await Post.findById(postId);

    if (!post) {
      throw new Error('Post not found');
    }

    post.markAsAnswered(tutorId as any, response);
    await post.save();

    return post;
  }

  /**
   * Update post
   */
  public async updatePost(
    postId: string,
    updates: Partial<IPost>
  ): Promise<IPost | null> {
    // Don't allow updating sensitive fields
    delete (updates as any).studentId;
    delete (updates as any).spaceId;
    delete (updates as any).difficultyScore;

    return Post.findByIdAndUpdate(postId, updates, {
      new: true,
      runValidators: true
    });
  }

  /**
   * Delete a post
   */
  public async deletePost(postId: string): Promise<void> {
    await Post.findByIdAndDelete(postId);
  }

  /**
   * Get unanswered posts in a space
   */
  public async getUnansweredPosts(spaceId: string): Promise<IPost[]> {
    return Post.find({ spaceId, isAnswered: false })
      .populate('studentId', '-password')
      .sort({ difficultyScore: -1 });
  }

  /**
   * Get knowledge summary for a space
   */
  public async getKnowledgeSummary(spaceId: string): Promise<string> {
    const posts = await Post.find({ spaceId });

    const allKnowledgePoints = posts.flatMap((post) => post.knowledgePoints);

    return AIRankingService.generateKnowledgeSummary(allKnowledgePoints);
  }

  /**
   * Get post statistics for a space
   */
  public async getPostStatistics(spaceId: string) {
    const posts = await Post.find({ spaceId });

    const total = posts.length;
    const answered = posts.filter((p) => p.isAnswered).length;
    const unanswered = total - answered;

    const difficultyDistribution = {
      easy: posts.filter((p) => p.difficultyLevel === DifficultyLevel.EASY).length,
      medium: posts.filter((p) => p.difficultyLevel === DifficultyLevel.MEDIUM).length,
      hard: posts.filter((p) => p.difficultyLevel === DifficultyLevel.HARD).length,
      veryHard: posts.filter((p) => p.difficultyLevel === DifficultyLevel.VERY_HARD).length,
      unranked: posts.filter((p) => p.difficultyLevel === DifficultyLevel.UNRANKED).length
    };

    const averageScore =
      total > 0 ? posts.reduce((sum, p) => sum + p.difficultyScore, 0) / total : 0;

    return {
      total,
      answered,
      unanswered,
      difficultyDistribution,
      averageScore
    };
  }
}

export default new PostService();
