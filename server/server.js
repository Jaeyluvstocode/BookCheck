const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const path = require('path');
const fs = require('fs');

const app = express();

// === CORS Configuration ===
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bookcheck-frontend.onrender.com';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// === Middleware ===
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// === JWT Secret from .env or Docker Secret ===
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

// === MongoDB Connection ===
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const MONGO_URI = process.env.MONGO_URI || 
  'mongodb+srv://Joseph:joseph123@cluster0.osf8csu.mongodb.net/bookcheck?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// === Health Check ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pid: process.pid, env: process.env.NODE_ENV || 'development' });
});

// === Serve React frontend in production ===
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// === Global Error Handlers ===
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// === Start Server ===
const server = app.listen(PORT, HOST, () => {
  console.log(`[SERVER] Running on ${HOST}:${PORT} (pid=${process.pid})`);
});

server.on('listening', () => console.log('[SERVER] Event: listening fired'));

server.on('error', (err) => {
  console.error('[SERVER] Error event:', err.code, err.message);
  if (err.code === 'EADDRINUSE') console.error('[SERVER] Port', PORT, 'is already in use!');
});
