import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

class AuthController {
  public async register(req: Request, res: Response) {
  try {
    // TEMP: log incoming body keys to spot FE/BE mismatch
    console.log('[auth/register] raw body keys:', Object.keys(req.body || {}));

    // Normalize common frontend names
    const raw = req.body || {};
    const firstName: string = (raw.firstName ?? '').toString().trim();
    const lastName: string = (raw.lastName ?? '').toString().trim();
    const username: string = (raw.username ?? '').toString().trim();
    const email: string = (raw.email ?? raw.userEmail ?? '').toString().trim().toLowerCase();
    const password: string = (raw.password ?? raw.pass ?? raw.pwd ?? '').toString();
    const role: string = (raw.role ?? 'student').toString();
    const tutorCode: string = (raw.tutorCode ?? '').toString().trim().toUpperCase();

    console.log('[auth/register] normalized:', { firstName, lastName, username, email, passLen: password?.length ?? 0, role, tutorCode });

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: { firstName: !!firstName, lastName: !!lastName, username: !!username, email: !!email, password: !!password },
      });
    }

    const { token, user } = await AuthService.register({ firstName, lastName, username, email, password, role, tutorCode });
    return res.status(201).json({ token, user });
  } catch (err: any) {
    console.error('[auth/register] ERROR:', err?.message, err);
    const msg = (err?.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('duplicate')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(400).json({ error: err?.message || 'Registration failed' });
  }
}


  public async login(req: Request, res: Response) {
    try {
      const body = req.body || {};
      // Support email or username login
      const identifier = (body.email || body.username || '').toString().trim();
      const password = (body.password || '').toString();

      if (!identifier || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
      }

      const { token, user } = await AuthService.login(identifier, password);
      return res.status(200).json({ token, user });
    } catch (err: any) {
      return res.status(401).json({ error: err.message || 'Invalid credentials' });
    }
  }

  public async me(req: Request & { user?: { userId: string } }, res: Response) {
    try {
      if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await AuthService.getUserById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch profile' });
    }
  }

  public async updateProfile(req: Request & { user?: { userId: string } }, res: Response) {
    try {
      if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
      const updates = req.body as Partial<{ name: string; email: string; role: string }>;
      const user = await AuthService.updateProfile(req.user.userId, updates);
      return res.status(200).json({ user });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to update profile' });
    }
  }

  public async changePassword(req: Request & { user?: { userId: string } }, res: Response) {
    try {
      if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
      const { oldPassword, newPassword } = req.body as { oldPassword: string; newPassword: string };
      await AuthService.changePassword(req.user.userId, oldPassword, newPassword);
      return res.status(200).json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Failed to change password' });
    }
  }

  public async getProfileStats(req: Request & { user?: { userId: string } }, res: Response) {
    try {
      if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
      const stats = await AuthService.getUserStats(req.user.userId);
      return res.status(200).json({ stats });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch stats' });
    }
  }
}

export default new AuthController();
