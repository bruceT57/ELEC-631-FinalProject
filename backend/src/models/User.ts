import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  STUDENT = 'student',
  TUTOR = 'tutor',
  ADMIN = 'admin',
  USER = 'user', // keep for backward-compat if referenced elsewhere
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'Path `firstName` is required.'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Path `lastName` is required.'],
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Path `username` is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Path `email` is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is invalid'],
    },
    password: {
      type: String,
      required: [true, 'Path `password` is required.'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT, // default aligns with routes using STUDENT/TUTOR/ADMIN
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  (this as IUser).password = await bcrypt.hash((this as IUser).password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
export type { IUser as TUser }; // optional alias if used elsewhere
