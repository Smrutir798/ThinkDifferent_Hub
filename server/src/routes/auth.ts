import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbService } from '../config/db.js';
import { membersService, isSupabaseConfigured } from '../config/supabase.js';
import { auth, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'thinkdifferent_os_secret_key_2026_super_secure_99';

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    const existingUser = isSupabaseConfigured
      ? await membersService.findByEmail(email)
      : await dbService.users.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    let newUser;
    if (isSupabaseConfigured) {
      newUser = await membersService.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'Owner',
        status: 'Active'
      });
    } else {
      newUser = await dbService.users.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'Owner',
      });
    }

    const userId = (newUser as any).id || (newUser as any)._id;
    const avatarUrl = (newUser as any).avatar_url || (newUser as any).avatarUrl || null;
    const githubUsername = (newUser as any).github_username || (newUser as any).githubUsername || null;
    const status = (newUser as any).status || 'Active';

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email: newUser.email, 
        role: newUser.role, 
        name: newUser.name,
        avatar_url: avatarUrl,
        github_username: githubUsername,
        status: status
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar_url: avatarUrl,
        github_username: githubUsername,
        status: status,
        createdAt: (newUser as any).created_at || (newUser as any).createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = isSupabaseConfigured
      ? await membersService.findByEmail(email)
      : await dbService.users.findByEmail(email);

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const userId = (user as any).id || (user as any)._id;
    const avatarUrl = (user as any).avatar_url || (user as any).avatarUrl || null;
    const githubUsername = (user as any).github_username || (user as any).githubUsername || null;
    const status = (user as any).status || 'Active';

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userId, 
        email: user.email, 
        role: user.role, 
        name: user.name,
        avatar_url: avatarUrl,
        github_username: githubUsername,
        status: status
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: avatarUrl,
        github_username: githubUsername,
        status: status,
        createdAt: (user as any).created_at || (user as any).createdAt
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// @route   GET api/auth/me
// @desc    Get current user details
router.get('/me', auth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = isSupabaseConfigured
      ? await membersService.findByEmail(authReq.user.email)
      : await dbService.users.findByEmail(authReq.user.email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = (user as any).id || (user as any)._id;
    const userCreatedAt = (user as any).created_at || (user as any).createdAt;
    const avatarUrl = (user as any).avatar_url || (user as any).avatarUrl || null;
    const githubUsername = (user as any).github_username || (user as any).githubUsername || null;
    const status = (user as any).status || 'Active';

    res.json({
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: avatarUrl,
      github_username: githubUsername,
      status: status,
      createdAt: userCreatedAt
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve user: ' + err.message });
  }
});

export default router;
