import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User } from '../models';
import config from '../config/config';

export interface IRegistrationData {
  name: string;
  email: string;
  password: string;
}

export interface IUser {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  password?: string;
  role?: string;
}

export interface ITokenPayload {
  userId: string;
  role?: string;
}

class AuthService {
  public async register(data: IRegistrationData): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
  const existing = await User.findOne({ email: data.email }).lean();
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(data.password, 10);

  // Provide safe defaults that many schemas expect (adjust if not used)
  const created = await User.create({
    name: data.name,
    email: data.email,
    password: hashed,
    role: (typeof (User as any).schema?.paths?.role !== 'undefined') ? 'student' : undefined,
    provider: (typeof (User as any).schema?.paths?.provider !== 'undefined') ? 'local' : undefined,
    createdAt: (typeof (User as any).schema?.paths?.createdAt !== 'undefined') ? new Date() : undefined,
    updatedAt: (typeof (User as any).schema?.paths?.updatedAt !== 'undefined') ? new Date() : undefined,
  });

  const userId = (created as any)._id?.toString?.() ?? String((created as any)._id);
  const safeUser = {
    _id: userId,
    name: (created as any).name,
    email: (created as any).email,
    role: (created as any).role,
  } as Omit<IUser, 'password'>;

  const token = this.generateToken({ ...(safeUser as any), _id: userId } as IUser);
  return { token, user: safeUser };
}

  public async login(email: string, password: string): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
    const userDoc = await User.findOne({ email });
    if (!userDoc) throw new Error('Invalid credentials');

    const ok = await bcrypt.compare(password, (userDoc as any).password || '');
    if (!ok) throw new Error('Invalid credentials');

<<<<<<< HEAD
=======
    // Check if user is approved
    if (!(userDoc as any).approved) {
      throw new Error('Your account is pending approval. Please wait for an administrator to approve your account.');
    }

>>>>>>> ai_feature_clean
    const userId = (userDoc as any)._id?.toString?.() ?? String((userDoc as any)._id);

    const safeUser = {
      _id: userId,
      name: (userDoc as any).name,
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
      name: (doc as any).name,
      email: (doc as any).email,
      role: (doc as any).role,
    } as Omit<IUser, 'password'>;
    }

  public async updateProfile(userId: string, updates: Partial<Pick<IUser, 'name' | 'email' | 'role'>>)
    : Promise<Omit<IUser, 'password'>> {
    const updated = await User.findByIdAndUpdate(userId, updates, { new: true })
      .select('-password');
    if (!updated) throw new Error('User not found');

    return {
      _id: ((updated as any)._id)?.toString?.() ?? String((updated as any)._id),
      name: (updated as any).name,
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

  public generateToken(user: IUser): string {
    const userId = (user as any)._id?.toString?.() ?? String((user as any)._id);
    const payload: ITokenPayload = { userId, role: (user as any).role };

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
