require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5001;

app.get('/', (_req, res) => {
  res.type('text').send(
    'QAN Checker API is running. Open the app at http://localhost:5173'
  );
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log('MongoDB will connect on first request');
});
