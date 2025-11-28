import mongoose, { Document, Schema } from 'mongoose';

/**
 * Input type enumeration
 */
export enum InputType {
  TEXT = 'text',
  OCR = 'ocr',
  VOICE = 'voice'
}

/**
 * Difficulty level enumeration (AI-ranked)
 */
export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
  UNRANKED = 'unranked'
}

/**
 * Media attachment interface
 */
export interface IMediaAttachment {
  url: string;
  type: string;
  originalName: string;
}

/**
 * Knowledge point interface
 */
export interface IKnowledgePoint {
  topic: string;
  subtopic?: string;
  concept: string;
}

export interface IReply {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  likes: mongoose.Types.ObjectId[];
}

/**
 * Post interface extending Mongoose Document
 */
export interface IPost extends Document {
  spaceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  question: string;
  inputType: InputType;
  originalText?: string;
  mediaAttachments: IMediaAttachment[];
  difficultyLevel: DifficultyLevel;
  difficultyScore: number;
  knowledgePoints: IKnowledgePoint[];
  tutorResponse?: string;
  isAnswered: boolean;
  answeredAt?: Date;
  answeredBy?: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
  markAsAnswered(tutorId: mongoose.Types.ObjectId, response: string): void;
  updateDifficultyRanking(level: DifficultyLevel, score: number): void;
}

/**
 * Post Schema definition
 */
const PostSchema: Schema = new Schema(
  {
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'VirtualSpace',
      required: true,
      index: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    inputType: {
      type: String,
      enum: Object.values(InputType),
      required: true
    },
    originalText: {
      type: String,
      trim: true
    },
    mediaAttachments: [
      {
        url: { type: String, required: true },
        type: { type: String, required: true },
        originalName: { type: String, required: true }
      }
    ],
    difficultyLevel: {
      type: String,
      enum: Object.values(DifficultyLevel),
      default: DifficultyLevel.UNRANKED
    },
    difficultyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    knowledgePoints: [
      {
        topic: { type: String, required: true },
        subtopic: { type: String },
        concept: { type: String, required: true }
      }
    ],
    tutorResponse: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    isAnswered: {
      type: Boolean,
      default: false
    },
    answeredAt: {
      type: Date
    },
    answeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [
      {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
        likes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
      }
    ]
  },
  {
    timestamps: true
  }
);

/**
 * Method to mark post as answered
 */
PostSchema.methods.markAsAnswered = function (
  tutorId: mongoose.Types.ObjectId,
  response: string
): void {
  this.isAnswered = true;
  this.answeredBy = tutorId;
  this.tutorResponse = response;
  this.answeredAt = new Date();
};

/**
 * Method to update difficulty ranking
 */
PostSchema.methods.updateDifficultyRanking = function (
  level: DifficultyLevel,
  score: number
): void {
  this.difficultyLevel = level;
  this.difficultyScore = score;
};

/**
 * Index for efficient querying
 */
PostSchema.index({ spaceId: 1, difficultyScore: -1 });
PostSchema.index({ spaceId: 1, createdAt: -1 });

export default mongoose.model<IPost>('Post', PostSchema);
