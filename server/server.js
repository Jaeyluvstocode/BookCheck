const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// if running in docker-compose with a secret mounted, load it
const fs = require('fs');
try {
  if (!process.env.JWT_SECRET) {
    const secretPath = '/run/secrets/jwt_secret';
    if (fs.existsSync(secretPath)) {
      process.env.JWT_SECRET = fs.readFileSync(secretPath, 'utf8').trim();
      console.log('[SERVER] Loaded JWT_SECRET from docker secret');
    }
  }
} catch (e) {
  console.warn('[SERVER] Could not load docker secret for JWT_SECRET', e.message);
}

// simple health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pid: process.pid, env: process.env.NODE_ENV || 'development' });
});

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err=> console.error('MongoDB connection error:', err.message));

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// bind to all interfaces to avoid localhost/127.0.0.1 binding issues on some systems
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, ()=> {
  console.log(`[SERVER] Running on ${HOST}:${PORT} (pid=${process.pid})`);
});

server.on('listening', () => {
  console.log('[SERVER] Event: listening fired');
});

server.on('error', (err) => {
  console.error('[SERVER] Error event:', err.code, err.message);
  if (err.code === 'EADDRINUSE') {
    console.error('[SERVER] Port', PORT, 'is already in use!');
  }
});
