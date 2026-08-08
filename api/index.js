// Vercel serverless entry — Express API
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const app = require('../backend/app');

module.exports = app;
