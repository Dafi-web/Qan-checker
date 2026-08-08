const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const qanRoutes = require('./routes/qans');
const checkRoutes = require('./routes/check');
const userRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('DB connect error:', error.message);
    next(error);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/qans', qanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/check', checkRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

module.exports = app;
