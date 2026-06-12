import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
// Routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import metricsRouter from './routes/metrics.js';
import membersRouter from './routes/members.js';
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://think-different-hub.vercel.app'
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(...process.env.FRONTEND_URL.split(',').map(url => url.trim().replace(/\/$/, '')));
}
console.log('===================================================');
console.log('CORS Whitelisted Origins:', allowedOrigins);
console.log('===================================================');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true
}));
app.use(express.json());
// Initialize Database Connection (or JSON fallback)
connectDB();
// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/members', membersRouter);
// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Serve Frontend static assets in Production
if (process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const clientDistPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));
    // Return frontend index.html for any SPA routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}
// Start Server
const server = app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`ThinkDifferent OS API Server running on port ${PORT}`);
    console.log(`Ready for developer-grade operations.`);
    console.log(`===================================================`);
});
process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection Error: ${err?.message || err}`);
});
