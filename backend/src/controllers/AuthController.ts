import { Request, Response } from 'express';
import AuthService from '../services/AuthService';

class AuthController {
  public async register(req: Request, res: Response) {
  try {
    // TEMP: log incoming body keys to spot FE/BE mismatch
    console.log('[auth/register] raw body keys:', Object.keys(req.body || {}));

    // Normalize common frontend names
    const raw = req.body || {};
    const name: string =
      (raw.name ?? raw.fullName ?? raw.username ?? raw.displayName ?? '').toString().trim();
    const email: string = (raw.email ?? raw.userEmail ?? '').toString().trim().toLowerCase();
    const password: string = (raw.password ?? raw.pass ?? raw.pwd ?? '').toString();

    console.log('[auth/register] normalized:', { name, email, passLen: password?.length ?? 0 });

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: { name: !!name, email: !!email, password: !!password },
      });
    }

    const { token, user } = await AuthService.register({ name, email, password });
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
      const { email, password } = req.body as { email: string; password: string };
      const { token, user } = await AuthService.login(email, password);
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
}

export default new AuthController();
