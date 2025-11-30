import mongoose, { Document, Schema } from 'mongoose';

/**
 * Virtual Space status enumeration
 */
export enum SpaceStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  EXPIRED = 'expired'
}

/**
 * VirtualSpace interface extending Mongoose Document
 */
export interface IVirtualSpace extends Document {
  spaceCode: string;
  qrCode: string;
  tutorId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: SpaceStatus;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  addParticipant(userId: mongoose.Types.ObjectId): void;
}

/**
 * VirtualSpace Schema definition
 */
const VirtualSpaceSchema: Schema = new Schema(
  {
    spaceCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    qrCode: {
      type: String,
      required: true
    },
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(SpaceStatus),
      default: SpaceStatus.ACTIVE,
      required: true
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

/**
 * Method to check if space is expired
 */
VirtualSpaceSchema.methods.isExpired = function (): boolean {
  return new Date() > this.endTime;
};

/**
 * Method to add participant to the space
 */
VirtualSpaceSchema.methods.addParticipant = function (
  userId: mongoose.Types.ObjectId
): void {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
  }
};

/**
 * Index for efficient querying
 */
VirtualSpaceSchema.index({ status: 1, endTime: 1 });

export default mongoose.model<IVirtualSpace>('VirtualSpace', VirtualSpaceSchema);
