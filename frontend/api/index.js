const path = require('path');

// Load env in local/dev; on Vercel, use dashboard env vars
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const app = require('../backend/app');

module.exports = app;
