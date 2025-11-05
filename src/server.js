import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Custom CORS handling so we can support multiple allowed origins
// Configure allowed origins via environment variable (comma-separated)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // If no origin (curl, server-to-server), allow the request
  if (!origin) return next();

  // If no configured origins, allow any origin (useful for quick dev)
  if (allowedOrigins.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  // Otherwise only allow requests from configured origins
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  // Not allowed by CORS
  res.status(403).json({ message: 'CORS policy: This origin is not allowed' });
});

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server function
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log('📝 Available endpoints:');
      console.log(`  - GET  http://localhost:${PORT}/health`);
      console.log(`  - POST http://localhost:${PORT}/api/auth/register`);
      console.log(`  - POST http://localhost:${PORT}/api/auth/login`);
      console.log(`  - GET  http://localhost:${PORT}/api/user/dashboard`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
};

// Handle process errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

startServer();