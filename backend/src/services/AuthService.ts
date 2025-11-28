import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, Post, TutorCode } from '../models';
import config from '../config/config';

export interface IRegistrationData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role?: string;
  tutorCode?: string;
}

export interface IUser {
  _id: Types.ObjectId | string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  role?: string;
}

export interface ITokenPayload {
  userId: string;
  sub?: string;
  email?: string;
  username?: string;
  role?: string;
}

class AuthService {
  public async register(data: IRegistrationData): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
    const existing = await User.findOne({ email: data.email }).lean();
    if (existing) throw new Error('Email already registered');

    const existingUsername = await User.findOne({ username: data.username }).lean();
    if (existingUsername) throw new Error('Username already taken');

    // Validate tutor code if registering as tutor
    if (data.role === 'tutor') {
      if (!data.tutorCode) {
        throw new Error('Tutor code is required for tutor registration');
      }
      
      console.log(`[AuthService] Validating tutor code: '${data.tutorCode}'`);
      const codeDoc = await TutorCode.findOne({ code: data.tutorCode, isUsed: false });
      console.log(`[AuthService] Code found:`, codeDoc ? 'yes' : 'no');
      
      if (!codeDoc) {
        throw new Error('Invalid or used tutor code');
      }
    }

    // Create user - password will be hashed by pre-save hook
    const created = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      password: data.password,
      role: data.role || 'student',
      isActive: true
    });

    // Mark tutor code as used
    if (data.role === 'tutor' && data.tutorCode) {
      console.log(`[AuthService] Marking code '${data.tutorCode}' as used by ${created._id}`);
      const updatedCode = await TutorCode.findOneAndUpdate(
        { code: data.tutorCode, isUsed: false },
        { isUsed: true, usedBy: created._id },
        { new: true }
      );
      
      console.log(`[AuthService] Code update result:`, updatedCode ? 'success' : 'failed');

      if (!updatedCode) {
        // This should theoretically not happen if the check above passed, 
        // but handles race conditions where code was used in between
        console.error(`[AuthService] Failed to mark tutor code ${data.tutorCode} as used for user ${created._id}`);
      }
    }

    const userId = (created as any)._id?.toString?.() ?? String((created as any)._id);
  const safeUser = {
    _id: userId,
    firstName: created.firstName,
    lastName: created.lastName,
    username: created.username,
    email: created.email,
    role: created.role,
  } as Omit<IUser, 'password'>;

  const token = this.generateToken({ ...(safeUser as any), _id: userId } as IUser);
  return { token, user: safeUser };
}

  public async login(identifier: string, password: string): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
    // Allow login with either email or username
    const userDoc = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });
    if (!userDoc) throw new Error('Invalid credentials');

    if (userDoc.isActive === false) {
      throw new Error('Account is suspended. Please contact administrator.');
    }

    const ok = await bcrypt.compare(password, (userDoc as any).password || '');
    if (!ok) throw new Error('Invalid credentials');

    const userId = (userDoc as any)._id?.toString?.() ?? String((userDoc as any)._id);

    const safeUser = {
      _id: userId,
      firstName: (userDoc as any).firstName,
      lastName: (userDoc as any).lastName,
      username: (userDoc as any).username,
      email: (userDoc as any).email,
      role: (userDoc as any).role,
    } as Omit<IUser, 'password'>;

    const token = this.generateToken({ ...(safeUser as any), _id: userId } as IUser);
    return { token, user: safeUser };
  }

  public async getUserById(userId: string): Promise<Omit<IUser, 'password'> | null> {
    const doc = await User.findById(userId).select('-password').lean();
    if (!doc) return null;
    return {
      _id: (doc as any)._id?.toString?.() ?? String((doc as any)._id),
      firstName: (doc as any).firstName,
      lastName: (doc as any).lastName,
      username: (doc as any).username,
      email: (doc as any).email,
      role: (doc as any).role,
    } as Omit<IUser, 'password'>;
    }

  public async updateProfile(userId: string, updates: Partial<Pick<IUser, 'firstName' | 'lastName' | 'email' | 'role'>>)
    : Promise<Omit<IUser, 'password'>> {
    const updated = await User.findByIdAndUpdate(userId, updates, { new: true })
      .select('-password');
    if (!updated) throw new Error('User not found');

    return {
      _id: ((updated as any)._id)?.toString?.() ?? String((updated as any)._id),
      firstName: (updated as any).firstName,
      lastName: (updated as any).lastName,
      username: (updated as any).username,
      email: (updated as any).email,
      role: (updated as any).role,
    } as Omit<IUser, 'password'>;
  }

  public async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const userDoc = await User.findById(userId);
    if (!userDoc) throw new Error('User not found');

    const ok = await bcrypt.compare(oldPassword, (userDoc as any).password || '');
    if (!ok) throw new Error('Old password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    (userDoc as any).password = hashed;
    await userDoc.save();
  }

  public async getUserStats(userId: string) {
    const questionsAsked = await Post.countDocuments({ studentId: userId });
    
    // Count replies by user
    const repliesResult = await Post.aggregate([
      { $unwind: '$replies' },
      { $match: { 'replies.author': new Types.ObjectId(userId) } },
      { $count: 'count' }
    ]);
    const questionsAnswered = repliesResult[0]?.count || 0;

    // Calculate likes received
    // 1. Likes on posts created by user
    const postLikesResult = await Post.aggregate([
      { $match: { studentId: new Types.ObjectId(userId) } },
      { $project: { likeCount: { $size: '$likes' } } },
      { $group: { _id: null, total: { $sum: '$likeCount' } } }
    ]);
    const postLikes = postLikesResult[0]?.total || 0;

    // 2. Likes on replies created by user
    const replyLikesResult = await Post.aggregate([
      { $unwind: '$replies' },
      { $match: { 'replies.author': new Types.ObjectId(userId) } },
      { $project: { likeCount: { $size: '$replies.likes' } } },
      { $group: { _id: null, total: { $sum: '$likeCount' } } }
    ]);
    const replyLikes = replyLikesResult[0]?.total || 0;

    return {
      questionsAsked,
      questionsAnswered,
      likesReceived: postLikes + replyLikes
    };
  }

  public generateToken(user: IUser): string {
    const userId = (user as any)._id?.toString?.() ?? String((user as any)._id);
    const payload: ITokenPayload = { 
      userId, 
      sub: userId,
      email: (user as any).email,
      username: (user as any).username,
      role: (user as any).role 
    };

    const secret: Secret = (config.jwtSecret as unknown as Secret) ?? '';
    const expiresIn: SignOptions['expiresIn'] = (config.jwtExpiresIn as any) ?? '7d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  public verifyToken(token: string): ITokenPayload {
    const secret: Secret = (config.jwtSecret as unknown as Secret) ?? '';
    const decoded = jwt.verify(token, secret);
    return decoded as ITokenPayload;
  }
}

export default new AuthService();
