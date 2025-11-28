import schedule from 'node-schedule';
import { VirtualSpace, SpaceStatus, Session, Post } from '../models';

/**
 * Archiving Service class for automatic space archiving
 */
class ArchivingService {
  private job: schedule.Job | null = null;

  /** Start automatic archiving scheduler */
  public start(): void {
    // Run every 1 minute (increased frequency for better responsiveness)
    this.job = schedule.scheduleJob('*/1 * * * *', async () => {
      console.log(`[ArchivingService] Checking for expired spaces at ${new Date().toISOString()}...`);
      await this.archiveExpiredSpaces();
    });
    console.log('✓ Archiving service started (runs every 1 minute)');
  }

  /** Stop the scheduler */
  public stop(): void {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      console.log('✓ Archiving service stopped');
    }
  }

  /** Archive all expired spaces */
  public async archiveExpiredSpaces(): Promise<number> {
    try {
      const now = new Date();

      // Get ONLY the _id values of expired active spaces to avoid typing issues
      const expiredIds = await VirtualSpace.distinct('_id', {
        status: SpaceStatus.ACTIVE,
        endTime: { $lte: now },
      });

      let archivedCount = 0;

      for (const id of expiredIds) {
        await this.archiveSpace(String(id));
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

  /** Archive a specific space */
  public async archiveSpace(spaceId: string): Promise<void> {
    try {
      // Get the space
      const space = await VirtualSpace.findById(spaceId)
        .populate('tutorId', '-password')
        .populate('participants', '-password')
        .lean();

      if (!space) {
        throw new Error('Space not found');
      }

      // Get all posts in the space
      const posts = await Post.find({ spaceId })
        .populate('studentId', '-password')
        .populate('answeredBy', '-password')
        .populate('replies.author', '-password')
        .sort({ difficultyScore: -1 })
        .lean();

      // Get or create session
      let session = await Session.findOne({ spaceId });

      if (!session) {
        session = new Session({
          spaceId,
          startTime: space.startTime,
          endTime: space.endTime,
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
          endTime: space.endTime,
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
          createdAt: post.createdAt,
          replies: post.replies // Include replies in the archive
        })),
        statistics: session.statistics,
      };

      // Archive the session
      session.archiveSession(archivedData);
      await session.save();

      // Update space status using Mongoose model directly since 'space' is a lean object
      await VirtualSpace.findByIdAndUpdate(spaceId, { status: SpaceStatus.ARCHIVED });

      console.log(`✓ Space ${space.spaceCode} archived successfully`);
    } catch (error) {
      console.error(`Error archiving space ${spaceId}:`, error);
      throw error;
    }
  }

  /** Get archived spaces */
  public async getArchivedSpaces(tutorId?: string) {
    const query: any = { isArchived: true };

    const sessions = await Session.find(query)
      .populate({
        path: 'spaceId',
        populate: { path: 'tutorId', select: '-password' },
      })
      .sort({ archivedAt: -1 });

    if (tutorId) {
      return sessions.filter((session: any) => {
        return session.spaceId?.tutorId?._id.toString() === tutorId;
      });
    }
    return sessions;
  }

  /** Get archived space details */
  public async getArchivedSpaceDetails(sessionId: string) {
    const session = await Session.findById(sessionId).populate('spaceId');

    if (!session || !session.isArchived) {
      throw new Error('Archived session not found');
    }

    return { session, data: session.archivedData };
  }

  /** Manually trigger archiving for a specific space */
  public async manualArchive(spaceId: string, userId: string): Promise<void> {
    const space = await VirtualSpace.findById(spaceId);
    if (!space) throw new Error('Space not found');

    // Verify user is the tutor or admin
    if (space.tutorId.toString() !== userId) {
      throw new Error('Only the tutor can manually archive this space');
    }

    await this.archiveSpace(spaceId);
  }

  /**
   * Delete an archived session and all associated data
   */
  public async deleteArchivedSession(sessionId: string): Promise<void> {
    const session = await Session.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const spaceId = session.spaceId;

    // Delete the session
    await Session.findByIdAndDelete(sessionId);

    // Delete the virtual space
    if (spaceId) {
      await VirtualSpace.findByIdAndDelete(spaceId);
      
      // Delete all posts associated with the space
      await Post.deleteMany({ spaceId });
    }
  }
}

export default new ArchivingService();
