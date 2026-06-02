require('dotenv').config();

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { Worker } = require('bullmq');
const connectDB = require('../config/db');
const { connection } = require('../config/queue');
const Campaign = require('../models/Campaign');
const Domain = require('../models/Domain');

const relayPort = Number.parseInt(process.env.MAIL_RELAY_PORT || '25', 10);

if (!Number.isInteger(relayPort) || relayPort <= 0) {
  throw new Error('MAIL_RELAY_PORT must be a positive integer');
}

const transport = nodemailer.createTransport({
  host: process.env.MAIL_RELAY_HOST || 'mail',
  port: relayPort,
  secure: false,
  ignoreTLS: process.env.MAIL_RELAY_IGNORE_TLS !== 'false'
});

const sleep = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const getDelaySeconds = (delaySettings) => {
  if (delaySettings.type === 'fixed') {
    return delaySettings.fixedValue;
  }

  return (
    Math.random() * (delaySettings.max - delaySettings.min) +
    delaySettings.min
  );
};

const completeCampaignIfFinished = async (campaignId) => {
  await Campaign.updateOne(
    {
      _id: campaignId,
      recipients: {
        $not: {
          $elemMatch: {
            status: 'pending'
          }
        }
      }
    },
    {
      $set: {
        status: 'Completed'
      }
    }
  );
};

const updateRecipientStatus = async (campaignId, recipientId, status) => {
  await Campaign.updateOne(
    {
      _id: campaignId,
      'recipients._id': recipientId
    },
    {
      $set: {
        'recipients.$.status': status
      }
    }
  );

  await completeCampaignIfFinished(campaignId);
};

const getUsageDate = () => new Date().toISOString().slice(0, 10);

const reserveDomainCapacity = async (domainId) => {
  const usageDate = getUsageDate();
  const domain = await Domain.findOneAndUpdate(
    {
      _id: domainId,
      status: 'Active',
      $or: [
        {
          usageDate: {
            $ne: usageDate
          }
        },
        {
          $expr: {
            $lt: [
              {
                $ifNull: ['$dailyUsage', 0]
              },
              '$dailyLimit'
            ]
          }
        }
      ]
    },
    [
      {
        $set: {
          usageDate,
          dailyUsage: {
            $cond: [
              {
                $eq: ['$usageDate', usageDate]
              },
              {
                $add: [
                  {
                    $ifNull: ['$dailyUsage', 0]
                  },
                  1
                ]
              },
              1
            ]
          }
        }
      }
    ],
    {
      new: true
    }
  );

  if (!domain) {
    throw new Error('Sending domain is disabled or has reached its daily limit');
  }
};

const releaseDomainCapacity = async (domainId) => {
  await Domain.updateOne(
    {
      _id: domainId,
      usageDate: getUsageDate(),
      dailyUsage: {
        $gt: 0
      }
    },
    {
      $inc: {
        dailyUsage: -1
      }
    }
  );
};

const recordDomainDelivery = async (domainId) => {
  await Domain.updateOne(
    {
      _id: domainId
    },
    {
      $inc: {
        totalEmailsSent: 1
      }
    }
  );
};

const processEmailJob = async (job) => {
  const {
    campaignId,
    recipientId,
    recipient,
    subject,
    htmlContent,
    sendingDomain,
    delaySettings
  } = job.data;
  let capacityReserved = false;
  let deliveryAccepted = false;

  try {
    await reserveDomainCapacity(sendingDomain.id);
    capacityReserved = true;

    await transport.sendMail({
      from: {
        name: sendingDomain.senderName,
        address: sendingDomain.senderEmail
      },
      to: {
        name: recipient.name,
        address: recipient.email
      },
      subject,
      html: htmlContent
    });
    deliveryAccepted = true;

    await recordDomainDelivery(sendingDomain.id);
    const delaySeconds = getDelaySeconds(delaySettings);
    await sleep(delaySeconds * 1000);
    await updateRecipientStatus(campaignId, recipientId, 'sent');

    return {
      recipient: recipient.email,
      domain: sendingDomain.domainName,
      status: 'sent'
    };
  } catch (error) {
    if (capacityReserved && !deliveryAccepted) {
      await releaseDomainCapacity(sendingDomain.id);
    }

    const attempts = job.opts.attempts || 1;

    if (job.attemptsMade + 1 >= attempts) {
      await updateRecipientStatus(campaignId, recipientId, 'failed');
    }

    throw error;
  }
};

const startWorker = async () => {
  await connectDB();
  await transport.verify();

  const worker = new Worker('emailSendingQueue', processEmailJob, {
    connection,
    concurrency: 1
  });

  worker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Email job ${job ? job.id : 'unknown'} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('Email worker error:', error.message);
  });

  const shutdown = async () => {
    await worker.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log('Email worker started and mail relay is reachable');
};

startWorker().catch((error) => {
  console.error('Unable to start email worker:', error.message);
  process.exit(1);
});
