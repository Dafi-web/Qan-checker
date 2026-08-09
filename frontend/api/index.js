const path = require('path');

// Prefer Vercel env; fall back to local backend/.env when present
try {
  require('dotenv').config({
    path: path.join(__dirname, '../../backend/.env'),
  });
} catch (_) {
  // dotenv optional on Vercel
}

let app;
try {
  // frontend/api -> repo/backend/app.js
  app = require('../../backend/app');
} catch (err) {
  console.error('Failed to load API app:', err);
  app = (req, res) => {
    res.status(500).json({
      message: 'API failed to start',
      error: err.message,
    });
  };
}

module.exports = app;
