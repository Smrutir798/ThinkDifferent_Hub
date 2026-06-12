import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbService } from '../config/db.js';
import { auth } from '../middleware/auth.js';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'thinkdifferent_os_secret_key_2026_super_secure_99';
// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }
    try {
        // Check for existing user
        const existingUser = await dbService.users.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user
        const newUser = await dbService.users.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'Owner',
        });
        // Generate JWT token
        const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Registration failed: ' + err.message });
    }
});
// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }
    try {
        const user = await dbService.users.findByEmail(email);
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // Validate password
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});
// @route   GET api/auth/me
// @desc    Get current user details
router.get('/me', auth, async (req, res) => {
    try {
        const authReq = req;
        if (!authReq.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await dbService.users.findByEmail(authReq.user.email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve user: ' + err.message });
    }
});
export default router;
