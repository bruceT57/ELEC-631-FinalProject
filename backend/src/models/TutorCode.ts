import mongoose, { Schema, Document } from 'mongoose';

export interface ITutorCode extends Document {
  code: string;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const TutorCodeSchema: Schema = new Schema({
  code: { type: String, required: true, unique: true },
  isUsed: { type: Boolean, default: false },
  usedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITutorCode>('TutorCode', TutorCodeSchema);
