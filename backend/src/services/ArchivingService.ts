import schedule from 'node-schedule';
import { VirtualSpace, SpaceStatus, Session, Post } from '../models';

/**
 * Archiving Service class for automatic space archiving
 */
class ArchivingService {
  private job: schedule.Job | null = null;

  /**
   * Start automatic archiving scheduler
   */
  public start(): void {
    // Run every 5 minutes
    this.job = schedule.scheduleJob('*/5 * * * *', async () => {
      await this.archiveExpiredSpaces();
    });

    console.log('✓ Archiving service started (runs every 5 minutes)');
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      console.log('✓ Archiving service stopped');
    }
  }

  /**
   * Archive all expired spaces
   */
  public async archiveExpiredSpaces(): Promise<number> {
    try {
      const now = new Date();

      // Find all active spaces that have expired
      const expiredSpaces = await VirtualSpace.find({
        status: SpaceStatus.ACTIVE,
        endTime: { $lte: now }
      });

      let archivedCount = 0;

      for (const space of expiredSpaces) {
        await this.archiveSpace(space._id.toString());
        archivedCount++;
      }

      if (archivedCount > 0) {
        console.log(`✓ Archived ${archivedCount} expired space(s)`);
      }

      return archivedCount;
    } catch (error) {
      console.error('Error archiving spaces:', error);
      return 0;
    }
  }

  /**
   * Archive a specific space
   */
  public async archiveSpace(spaceId: string): Promise<void> {
    try {
      // Get the space
      const space = await VirtualSpace.findById(spaceId)
        .populate('tutorId', '-password')
        .populate('participants', '-password');

      if (!space) {
        throw new Error('Space not found');
      }

      // Get all posts in the space
      const posts = await Post.find({ spaceId })
        .populate('studentId', '-password')
        .populate('answeredBy', '-password')
        .sort({ difficultyScore: -1 });

      // Get or create session
      let session = await Session.findOne({ spaceId });

      if (!session) {
        session = new Session({
          spaceId,
          startTime: space.startTime,
          endTime: space.endTime
        });
      }

      // Calculate statistics
      await session.calculateStatistics();

      // Prepare archived data
      const archivedData = {
        space: {
          name: space.name,
          description: space.description,
          spaceCode: space.spaceCode,
          tutor: space.tutorId,
          participants: space.participants,
          startTime: space.startTime,
          endTime: space.endTime
        },
        posts: posts.map((post) => ({
          question: post.question,
          student: post.studentId,
          inputType: post.inputType,
          difficultyLevel: post.difficultyLevel,
          difficultyScore: post.difficultyScore,
          knowledgePoints: post.knowledgePoints,
          isAnswered: post.isAnswered,
          tutorResponse: post.tutorResponse,
          answeredBy: post.answeredBy,
          answeredAt: post.answeredAt,
          createdAt: post.createdAt
        })),
        statistics: session.statistics
      };

      // Archive the session
      session.archiveSession(archivedData);
      await session.save();

      // Update space status
      space.status = SpaceStatus.ARCHIVED;
      await space.save();

      console.log(`✓ Space ${space.spaceCode} archived successfully`);
    } catch (error) {
      console.error(`Error archiving space ${spaceId}:`, error);
      throw error;
    }
  }

  /**
   * Get archived spaces
   */
  public async getArchivedSpaces(tutorId?: string) {
    const query: any = { isArchived: true };

    const sessions = await Session.find(query)
      .populate({
        path: 'spaceId',
        populate: { path: 'tutorId', select: '-password' }
      })
      .sort({ archivedAt: -1 });

    // Filter by tutor if specified
    if (tutorId) {
      return sessions.filter((session: any) => {
        return session.spaceId?.tutorId?._id.toString() === tutorId;
      });
    }

    return sessions;
  }

  /**
   * Get archived space details
   */
  public async getArchivedSpaceDetails(sessionId: string) {
    const session = await Session.findById(sessionId).populate('spaceId');

    if (!session || !session.isArchived) {
      throw new Error('Archived session not found');
    }

    return {
      session,
      data: session.archivedData
    };
  }

  /**
   * Manually trigger archiving for a specific space
   */
  public async manualArchive(spaceId: string, userId: string): Promise<void> {
    const space = await VirtualSpace.findById(spaceId);

    if (!space) {
      throw new Error('Space not found');
    }

    // Verify user is the tutor or admin
    if (space.tutorId.toString() !== userId) {
      throw new Error('Only the tutor can manually archive this space');
    }

    await this.archiveSpace(spaceId);
  }
}

export default new ArchivingService();
