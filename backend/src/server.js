require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('./config/db');
const { emailSendingQueue } = require('./config/queue');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

app.use('/api', apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      message: 'Request body contains invalid JSON'
    });
  }

  console.error('Unhandled server error:', error);

  return res.status(500).json({
    message: 'Internal server error'
  });
});

const startServer = async () => {
  await connectDB();

  const port = Number.parseInt(process.env.PORT || '5000', 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  const server = app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await emailSendingQueue.close();
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer().catch((error) => {
  console.error('Unable to start API server:', error.message);
  process.exit(1);
});
