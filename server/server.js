import dotenv from 'dotenv';
dotenv.config(); // MUST be before any imports that use env vars (cloudinary, etc.)

import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

// Route imports
import userRoutes from './routes/userRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import creditsRoutes from './routes/creditsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import blogRoutes from './routes/blogRoutes.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// ─── Socket.IO Setup ───
export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    socket.on('setup', (userData) => {
        if (userData?.clerkId) {
            socket.join(userData.clerkId);
            socket.emit('connected');
        }
    });
});

// ─── Middleware ───
app.use(cors({
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
}));

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── API Routes ───
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });
});

// ─── 404 Handler ───
app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Error Handler ───
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
});

// ─── Start Server ───
const startServer = async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(`\n  UrbanRent API Server`);
        console.log(`  ────────────────────`);
        console.log(`  Port:        ${PORT}`);
        console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`  Client URL:  ${process.env.CLIENT_URL || 'http://localhost:5173, http://localhost:5174'}`);
        console.log(`  Health:      http://localhost:${PORT}/api/health\n`);
    });
};

startServer();
