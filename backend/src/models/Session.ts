import mongoose, { Document, Schema } from 'mongoose';

/**
 * Session statistics interface
 */
export interface ISessionStatistics {
  totalPosts: number;
  answeredPosts: number;
  unansweredPosts: number;
  participantCount: number;
  averageDifficultyScore: number;
}

/**
 * Session interface extending Mongoose Document
 */
export interface ISession extends Document {
  spaceId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  actualEndTime?: Date;
  statistics: ISessionStatistics;
  archivedData: any;
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  calculateStatistics(): Promise<ISessionStatistics>;
  archiveSession(data: any): void;
}

/**
 * Session Schema definition
 */
const SessionSchema: Schema = new Schema(
  {
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'VirtualSpace',
      required: true,
      index: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    actualEndTime: {
      type: Date
    },
    statistics: {
      totalPosts: { type: Number, default: 0 },
      answeredPosts: { type: Number, default: 0 },
      unansweredPosts: { type: Number, default: 0 },
      participantCount: { type: Number, default: 0 },
      averageDifficultyScore: { type: Number, default: 0 }
    },
    archivedData: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

/**
 * Method to calculate session statistics
 */
SessionSchema.methods.calculateStatistics = async function (): Promise<ISessionStatistics> {
  const Post = mongoose.model('Post');
<<<<<<< HEAD
  const VirtualSpace = mongoose.model('VirtualSpace');

  const posts = await Post.find({ spaceId: this.spaceId });
  const space = await VirtualSpace.findById(this.spaceId);
=======
  const StudentParticipant = mongoose.model('StudentParticipant');

  const posts = await Post.find({ spaceId: this.spaceId });

  // Count unique participants using StudentParticipant model
  const participantCount = await StudentParticipant.countDocuments({ spaceId: this.spaceId });
>>>>>>> ai_feature_clean

  const totalPosts = posts.length;
  const answeredPosts = posts.filter((p: any) => p.isAnswered).length;
  const unansweredPosts = totalPosts - answeredPosts;
<<<<<<< HEAD
  const participantCount = space ? space.participants.length : 0;
=======
>>>>>>> ai_feature_clean

  const totalScore = posts.reduce((sum: number, p: any) => sum + p.difficultyScore, 0);
  const averageDifficultyScore = totalPosts > 0 ? totalScore / totalPosts : 0;

  this.statistics = {
    totalPosts,
    answeredPosts,
    unansweredPosts,
    participantCount,
    averageDifficultyScore
  };

  return this.statistics;
};

/**
 * Method to archive session
 */
SessionSchema.methods.archiveSession = function (data: any): void {
  this.isArchived = true;
  this.archivedAt = new Date();
<<<<<<< HEAD
  this.actualEndTime = new Date();
=======
  // Only set actualEndTime if not already set (prevents time from changing on re-save)
  if (!this.actualEndTime) {
    this.actualEndTime = new Date();
  }
>>>>>>> ai_feature_clean
  this.archivedData = data;
};

/**
 * Index for efficient querying
 */
SessionSchema.index({ isArchived: 1, endTime: -1 });

export default mongoose.model<ISession>('Session', SessionSchema);
