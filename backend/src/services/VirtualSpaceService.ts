import QRCode from 'qrcode';
import { VirtualSpace, IVirtualSpace, SpaceStatus, Session } from '../models';
import { randomBytes } from 'crypto';
import config from '../config/config';

/**
 * Virtual Space creation data interface
 */
export interface IVirtualSpaceData {
  tutorId: string;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
}

/**
 * VirtualSpace Service class
 */
class VirtualSpaceService {
  /**
   * Generate unique space code
   */
  private generateSpaceCode(): string {
    return randomBytes(8).toString('hex').toUpperCase();
  }

  /**
   * Generate QR code for space
   */
  private async generateQRCode(spaceCode: string): Promise<string> {
    const url = `${config.frontendUrl}/join/${spaceCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });
    return qrCodeDataUrl;
  }

  /**
   * Create a new virtual space
   */
  public async createSpace(data: IVirtualSpaceData): Promise<IVirtualSpace> {
    // Validate dates
    if (new Date(data.endTime) <= new Date(data.startTime)) {
      throw new Error('End time must be after start time');
    }

    // Generate unique space code
    let spaceCode: string;
    let isUnique = false;

    do {
      spaceCode = this.generateSpaceCode();
      const existing = await VirtualSpace.findOne({ spaceCode });
      if (!existing) {
        isUnique = true;
      }
    } while (!isUnique);

    // Generate QR code
    const qrCode = await this.generateQRCode(spaceCode);

    // Create virtual space
    const space = new VirtualSpace({
      ...data,
      spaceCode,
      qrCode,
      status: SpaceStatus.ACTIVE,
      participants: []
    });

    await space.save();

    // Create associated session
    const session = new Session({
      spaceId: space._id,
      startTime: data.startTime,
      endTime: data.endTime
    });

    await session.save();

    return space;
  }

  /**
   * Get space by code
   */
  public async getSpaceByCode(spaceCode: string): Promise<IVirtualSpace | null> {
    return VirtualSpace.findOne({ spaceCode }).populate('tutorId', '-password');
  }

  /**
   * Get space by ID
   */
  public async getSpaceById(spaceId: string): Promise<IVirtualSpace | null> {
    return VirtualSpace.findById(spaceId).populate('tutorId', '-password');
  }

  /**
   * Join a virtual space as student
   */
  public async joinSpace(spaceCode: string, studentId: string): Promise<IVirtualSpace> {
    const space = await VirtualSpace.findOne({ spaceCode });

    if (!space) {
      throw new Error('Virtual space not found');
    }

    if (space.status !== SpaceStatus.ACTIVE) {
      throw new Error('This space is no longer active');
    }

    if (space.isExpired()) {
      throw new Error('This space has expired');
    }

    // Add participant
    space.addParticipant(studentId as any);
    await space.save();

    return space;
  }

  /**
   * Get spaces by tutor
   */
  public async getSpacesByTutor(
    tutorId: string,
    status?: SpaceStatus
  ): Promise<IVirtualSpace[]> {
    const query: any = { tutorId };
    if (status) {
      query.status = status;
    }

    return VirtualSpace.find(query)
      .populate('participants', '-password')
      .sort({ createdAt: -1 });
  }

  /**
   * Get spaces where user is participant
   */
  public async getSpacesByParticipant(userId: string): Promise<IVirtualSpace[]> {
    return VirtualSpace.find({
      participants: userId
    })
      .populate('tutorId', '-password')
      .sort({ createdAt: -1 });
  }

  /**
   * Update space status
   */
  public async updateSpaceStatus(
    spaceId: string,
    status: SpaceStatus
  ): Promise<IVirtualSpace | null> {
    return VirtualSpace.findByIdAndUpdate(
      spaceId,
      { status },
      { new: true, runValidators: true }
    );
  }

  /**
   * Get all participants in a space
   */
  public async getParticipants(spaceId: string) {
    const space = await VirtualSpace.findById(spaceId).populate(
      'participants',
      '-password'
    );
    return space?.participants || [];
  }

  /**
   * Get participant count for a space (includes anonymous students)
   */
  public async getParticipantCount(spaceId: string): Promise<number> {
    const StudentParticipant = (await import('../models/StudentParticipant')).default;

    // Count unique anonymous student participants
    const count = await StudentParticipant.countDocuments({ spaceId });

    return count;
  }

  /**
   * Delete a space (only if no posts exist)
   */
  public async deleteSpace(spaceId: string): Promise<void> {
    const Post = (await import('../models')).Post;
    const postCount = await Post.countDocuments({ spaceId });

    if (postCount > 0) {
      throw new Error('Cannot delete space with existing posts. Archive it instead.');
    }

    await VirtualSpace.findByIdAndDelete(spaceId);
    await Session.deleteMany({ spaceId });
  }

  /**
   * Regenerate QR codes for all spaces (use this when IP address changes)
   */
  public async regenerateAllQRCodes(): Promise<number> {
    const spaces = await VirtualSpace.find({});
    let updatedCount = 0;

    for (const space of spaces) {
      const newQRCode = await this.generateQRCode(space.spaceCode);
      space.qrCode = newQRCode;
      await space.save();
      updatedCount++;
    }

    console.log(`✓ Regenerated QR codes for ${updatedCount} spaces with new URL: ${config.frontendUrl}`);
    return updatedCount;
  }
}

export default new VirtualSpaceService();
