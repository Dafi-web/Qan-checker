// Vercel serverless entry (repo-root deploy)
const path = require('path');

try {
  require('dotenv').config({
    path: path.join(__dirname, '../backend/.env'),
  });
} catch (_) {
  // ignore
}

let app;
try {
  app = require('../backend/app');
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
