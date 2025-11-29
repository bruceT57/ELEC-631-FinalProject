import mongoose, { Document, Schema } from 'mongoose';

/**
 * Student Participant interface
 * For anonymous students who join via QR code with just nickname and email
 */
export interface IStudentParticipant extends Document {
  spaceId: mongoose.Types.ObjectId;
  nickname: string;
  email: string;
  joinedAt: Date;
  sessionToken: string; // Temporary session token for this space
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student Participant Schema
 */
const StudentParticipantSchema: Schema = new Schema(
  {
    spaceId: {
      type: Schema.Types.ObjectId,
      ref: 'VirtualSpace',
      required: true,
      index: true
    },
    nickname: {
      type: String,
      required: [true, 'Nickname is required'],
      trim: true,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is invalid']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for space and email uniqueness per space
StudentParticipantSchema.index({ spaceId: 1, email: 1 }, { unique: true });

export default mongoose.model<IStudentParticipant>('StudentParticipant', StudentParticipantSchema);
