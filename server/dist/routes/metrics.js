import { Router } from 'express';
import { dbService } from '../config/db.js';
import { auth } from '../middleware/auth.js';
const router = Router();
// @route   GET api/metrics
// @desc    Retrieve aggregated system metrics and monthly progression
router.get('/', auth, async (req, res) => {
    try {
        const stats = await dbService.metrics.get();
        res.json(stats);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve platform metrics: ' + err.message });
    }
});
// @route   GET api/activities
// @desc    Retrieve recent platform activity logs
router.get('/activities', auth, async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const logs = await dbService.activities.find(limit);
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to retrieve activities: ' + err.message });
    }
});
export default router;
