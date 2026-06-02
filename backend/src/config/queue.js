const { Queue } = require('bullmq');

const redisPort = Number.parseInt(process.env.REDIS_PORT || '6379', 10);

if (!Number.isInteger(redisPort) || redisPort <= 0) {
  throw new Error('REDIS_PORT must be a positive integer');
}

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: redisPort,
  maxRetriesPerRequest: null
};

const emailSendingQueue = new Queue('emailSendingQueue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000
  }
});

emailSendingQueue.on('error', (error) => {
  console.error('Email queue error:', error.message);
});

module.exports = {
  connection,
  emailSendingQueue
};
