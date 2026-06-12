import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { membersService, isSupabaseConfigured } from '../config/supabase.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// @route   GET api/members/config
// @desc    Check whether Supabase connection parameters are active
router.get('/config', auth, async (req: Request, res: Response) => {
  res.json({ isSupabaseConfigured });
});

// @route   GET api/members
// @desc    Retrieve all members in ThinkDifferent (filtered by search)
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const list = await membersService.find(search as string);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to query members database: ' + err.message });
  }
});

// @route   POST api/members
// @desc    Add a new member to ThinkDifferent
router.post('/', auth, async (req: Request, res: Response) => {
  const { name, email, role, status, password, avatar_url, github_username } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Missing required fields: name, email' });
  }

  try {
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newMember = await membersService.create({
      name,
      email,
      role: role || 'Developer',
      status: status || 'Active',
      password: hashedPassword,
      avatar_url,
      github_username
    });
    res.status(201).json(newMember);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create member record: ' + err.message });
  }
});

// @route   PUT api/members/:id
// @desc    Update member profile details
router.put('/:id', auth, async (req: Request, res: Response) => {
  const { name, email, role, status, avatar_url, github_username } = req.body;
  const { id } = req.params;

  try {
    const updated = await membersService.update(id, { name, email, role, status, avatar_url, github_username });
    if (!updated) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update member record: ' + err.message });
  }
});

// @route   PUT api/members/:id/reset-password
// @desc    Reset a member's password
router.put('/:id/reset-password', auth, async (req: Request, res: Response) => {
  const { password } = req.body;
  const { id } = req.params;

  if (!password) {
    return res.status(400).json({ error: 'New password is required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await membersService.update(id, { password: hashedPassword });
    if (!updated) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Password reset successful' });
  } catch (err: any) {
    res.status(500).json({ error: 'Password reset failed: ' + err.message });
  }
});

// @route   DELETE api/members/:id
// @desc    Remove a member profile
router.delete('/:id', auth, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const success = await membersService.delete(id);
    if (!success) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member deleted successfully', success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete member record: ' + err.message });
  }
});

export default router;
