import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
// Routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import metricsRouter from './routes/metrics.js';
// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json());
// Initialize Database Connection (or JSON fallback)
connectDB();
// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/metrics', metricsRouter);
// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
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
