import { SortOrder } from 'mongoose';
import { Post } from '../models';
import AIRankingService from './AIRankingService';

export interface IPostMedia {
  url: string;
  mimeType?: string;
  originalName?: string;
}

export interface IPostData {
  spaceId: string;
  studentId: string;
  question: string;
  inputType?: string;
  difficultyLevel?: string;
  knowledgePoints?: string[];
  // Added to satisfy controller usage:
  originalText?: string;
  mediaAttachments?: IPostMedia[];
}

class PostService {
  /** Create a post and kick off background AI analysis */
  public async createPost(data: IPostData) {
    const post = await Post.create({
      spaceId: data.spaceId,
      studentId: data.studentId,
      question: data.question,
      inputType: data.inputType,
      difficultyLevel: data.difficultyLevel,
      knowledgePoints: data.knowledgePoints ?? [],
      originalText: data.originalText,            // <- optional
      mediaAttachments: data.mediaAttachments ?? [], // <- optional
      isAnswered: false,
    });

    // Normalize _id safely to string for background task
    const postId = (post as any)?._id?.toString?.() ?? String((post as any)?._id);
    this.analyzePostInBackground(postId, data.question).catch((err) =>
      console.error('AI analysis failed:', err)
    );

    return post;
  }

  /** Background AI analysis updates difficulty score etc. */
  private async analyzePostInBackground(postId: string, question: string) {
    try {
      const result = await AIRankingService.analyzeQuestion(question);
      await Post.findByIdAndUpdate(postId, {
        difficultyScore: result.difficultyScore,
        knowledgePoints: result.knowledgePoints,
      });
    } catch (err) {
      console.error(`analyzePostInBackground error for post ${postId}:`, err);
    }
  }

  /**
   * List posts in a space with sorting
   * Accepts 'difficulty' | 'recent' | 'time' (alias for 'recent')
   */
  public async getPostsBySpace(
    spaceId: string,
    sortBy: 'difficulty' | 'recent' | 'time' = 'recent'
  ) {
    const normalized = sortBy === 'time' ? 'recent' : sortBy;

    const sortOption: Record<string, SortOrder> =
      normalized === 'difficulty'
        ? { difficultyScore: -1 as SortOrder }
        : { createdAt: -1 as SortOrder };

    return Post.find({ spaceId })
      .populate('studentId', '-password')
      .populate('answeredBy', '-password')
      .sort(sortOption);
  }

  /** List posts created by a specific student */
  public async getPostsByStudent(studentId: string) {
    return Post.find({ studentId })
      .populate('studentId', '-password')
      .populate('answeredBy', '-password')
      .sort({ createdAt: -1 as SortOrder });
  }

  /** Get a single post by id */
  public async getPostById(postId: string) {
    return Post.findById(postId)
      .populate('studentId', '-password')
      .populate('answeredBy', '-password');
  }

  /** Tutor answers a post */
  public async answerPost(postId: string, tutorId: string, tutorResponse: string) {
    const updated = await Post.findByIdAndUpdate(
      postId,
      {
        isAnswered: true,
        answeredBy: tutorId,
        tutorResponse,
        answeredAt: new Date(),
      },
      { new: true }
    )
      .populate('studentId', '-password')
      .populate('answeredBy', '-password');

    return updated;
  }

  /** Update a post's fields (student editing or admin) */
  public async updatePost(
    postId: string,
    updates: Partial<{
      question: string;
      inputType: string;
      difficultyLevel: string;
      knowledgePoints: string[];
      originalText: string;
      mediaAttachments: IPostMedia[];
      isAnswered: boolean;
      tutorResponse: string;
      answeredBy: string;
      answeredAt: Date;
    }>
  ) {
    const updated = await Post.findByIdAndUpdate(postId, updates, { new: true })
      .populate('studentId', '-password')
      .populate('answeredBy', '-password');

    return updated;
  }

  /** Delete a post */
  public async deletePost(postId: string) {
    await Post.findByIdAndDelete(postId);
  }

  /** Unanswered posts in a space */
  public async getUnansweredPosts(spaceId: string) {
    return Post.find({ spaceId, isAnswered: false })
      .populate('studentId', '-password')
      .populate('answeredBy', '-password')
      .sort({ createdAt: -1 as SortOrder });
  }

  /** Knowledge point frequency summary for a space */
  public async getKnowledgeSummary(spaceId: string) {
    // Aggregation to count knowledgePoints occurrences
    const pipeline = [
      { $match: { spaceId } },
      { $unwind: { path: '$knowledgePoints', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$knowledgePoints', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const rows = await (Post as any).aggregate(pipeline);
    // Normalize to { point, count }
    return rows.map((r: any) => ({ point: r._id, count: r.count }));
  }

  /** Basic statistics for posts in a space */
  public async getPostStatistics(spaceId: string) {
    const [total, answered, agg] = await Promise.all([
      Post.countDocuments({ spaceId }),
      Post.countDocuments({ spaceId, isAnswered: true }),
      Post.aggregate([
        { $match: { spaceId } },
        {
          $group: {
            _id: null,
            avgDifficulty: { $avg: '$difficultyScore' },
          },
        },
      ]),
    ]);

    const avgDifficulty = agg?.[0]?.avgDifficulty ?? null;

    // Optional: distribution by difficultyLevel
    const byLevel = await Post.aggregate([
      { $match: { spaceId } },
      { $group: { _id: '$difficultyLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return {
      total,
      answered,
      unanswered: Math.max(0, total - answered),
      avgDifficulty,
      byLevel: byLevel.map((r: any) => ({ level: r._id, count: r.count })),
    };
  }
}

export default new PostService();
