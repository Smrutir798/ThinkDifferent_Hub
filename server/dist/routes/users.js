import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../config/db.js';
import { auth } from '../middleware/auth.js';
const router = Router();
// @route   GET api/users
// @desc    Get all users in the collection (filtered by search)
router.get('/', auth, async (req, res) => {
    try {
        const { search } = req.query;
        const filters = {};
        if (search)
            filters.search = search;
        const list = await dbService.users.find(filters);
        // Strip passwords before returning
        const safeList = list.map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
        }));
        res.json(safeList);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch users database: ' + err.message });
    }
});
// @route   POST api/users
// @desc    Add/register a new user
router.post('/', auth, async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }
    try {
        // Check if user already exists
        const existing = await dbService.users.findByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists with this email address' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await dbService.users.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'admin'
        });
        // Create activity event log
        await dbService.activities.create(`Administrator registered new user account '${newUser.name}' (${newUser.role}) in the system database.`, 'system');
        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt
        });
    }
    catch (err) {
        res.status(500).json({ error: 'User registration failed: ' + err.message });
    }
});
// @route   PUT api/users/:id
// @desc    Update user details
router.put('/:id', auth, async (req, res) => {
    const { name, email, role } = req.body;
    const { id } = req.params;
    if (!name || !email || !role) {
        return res.status(400).json({ error: 'Missing required fields: name, email, role' });
    }
    try {
        const user = await dbService.users.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if email changed and is taken
        if (email.toLowerCase() !== user.email.toLowerCase()) {
            const existing = await dbService.users.findByEmail(email);
            if (existing) {
                return res.status(400).json({ error: 'User already exists with this email address' });
            }
        }
        const updatedUser = await dbService.users.update(id, { name, email, role });
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Create activity event log
        await dbService.activities.create(`Administrator updated user account details for '${updatedUser.name}' (${updatedUser.role}).`, 'system');
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt
        });
    }
    catch (err) {
        res.status(500).json({ error: 'User update failed: ' + err.message });
    }
});
// @route   PUT api/users/:id/reset-password
// @desc    Reset a user's password
router.put('/:id/reset-password', auth, async (req, res) => {
    const { password } = req.body;
    const { id } = req.params;
    if (!password) {
        return res.status(400).json({ error: 'New password is required' });
    }
    try {
        const user = await dbService.users.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbService.users.update(id, { password: hashedPassword });
        // Create activity event log
        await dbService.activities.create(`Administrator reset the password for user account '${user.name}'.`, 'system');
        res.json({ message: 'Password reset successful' });
    }
    catch (err) {
        res.status(500).json({ error: 'Password reset failed: ' + err.message });
    }
});
// @route   DELETE api/users/:id
// @desc    Delete a user
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const authReq = req;
    // Prevent self-deletion
    if (authReq.user && authReq.user.id === id) {
        return res.status(400).json({ error: 'Forbidden: You cannot delete your own active administrator profile.' });
    }
    try {
        const user = await dbService.users.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const success = await dbService.users.delete(id);
        if (!success) {
            return res.status(500).json({ error: 'Failed to delete user' });
        }
        // Create activity event log
        await dbService.activities.create(`Administrator deleted user account '${user.name}' (${user.role}) from system.`, 'system');
        res.json({ message: 'User deleted successfully', success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'User deletion failed: ' + err.message });
    }
});
export default router;
