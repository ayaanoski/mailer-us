const Campaign = require('../models/Campaign');
const Domain = require('../models/Domain');
const { emailSendingQueue } = require('../config/queue');

const createCampaign = async (req, res) => {
  try {
    const {
      name,
      subject,
      htmlContent,
      recipients,
      senderRotationMode,
      selectedDomains,
      delaySettings
    } = req.body;

    const campaign = await Campaign.create({
      name,
      subject,
      htmlContent,
      recipients,
      senderRotationMode,
      selectedDomains,
      delaySettings,
      status: 'Draft'
    });

    return res.status(201).json({
      campaign
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Unable to create campaign',
      error: error.message
    });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate(
        'selectedDomains',
        'domainName senderEmail senderName status'
      )
      .sort({ createdAt: -1 });

    return res.json({
      campaigns
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to retrieve campaigns',
      error: error.message
    });
  }
};

const chooseDomain = (mode, domains, roundRobinState) => {
  if (mode === 'Fixed') {
    return domains[0];
  }

  if (mode === 'Random') {
    return domains[Math.floor(Math.random() * domains.length)];
  }

  const domain = domains[roundRobinState.index];
  roundRobinState.index = (roundRobinState.index + 1) % domains.length;
  return domain;
};

const launchCampaign = async (req, res) => {
  let campaign;
  let originalRoundRobinIndex;

  try {
    campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        message: 'Campaign not found'
      });
    }

    if (campaign.status !== 'Draft') {
      return res.status(409).json({
        message: `Campaign cannot be launched while its status is ${campaign.status}`
      });
    }

    const activeDomains = await Domain.find({
      _id: {
        $in: campaign.selectedDomains
      },
      status: 'Active'
    });

    const domainsById = new Map(
      activeDomains.map((domain) => [domain._id.toString(), domain])
    );
    const domains = campaign.selectedDomains
      .map((domainId) => domainsById.get(domainId.toString()))
      .filter(Boolean);

    if (domains.length === 0) {
      return res.status(400).json({
        message: 'Campaign requires at least one selected Active domain'
      });
    }

    const pendingRecipients = campaign.recipients.filter(
      (recipient) => recipient.status === 'pending'
    );

    if (pendingRecipients.length === 0) {
      campaign.status = 'Completed';
      await campaign.save();

      return res.json({
        message: 'Campaign has no pending recipients and is now Completed',
        queuedJobs: 0,
        campaign
      });
    }

    originalRoundRobinIndex = campaign.currentRoundRobinIndex;
    const roundRobinState = {
      index: originalRoundRobinIndex % domains.length
    };

    const jobs = pendingRecipients.map((recipient) => {
      const domain = chooseDomain(
        campaign.senderRotationMode,
        domains,
        roundRobinState
      );

      return {
        name: 'send-email',
        data: {
          campaignId: campaign._id.toString(),
          recipientId: recipient._id.toString(),
          recipient: {
            name: recipient.name,
            email: recipient.email
          },
          subject: campaign.subject,
          htmlContent: campaign.htmlContent,
          sendingDomain: {
            id: domain._id.toString(),
            domainName: domain.domainName,
            senderEmail: domain.senderEmail,
            senderName: domain.senderName
          },
          delaySettings: campaign.delaySettings.toObject()
        },
        opts: {
          jobId: `${campaign._id.toString()}-${recipient._id.toString()}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      };
    });

    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaign._id,
        status: 'Draft'
      },
      {
        $set: {
          status: 'Running',
          currentRoundRobinIndex: roundRobinState.index
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedCampaign) {
      return res.status(409).json({
        message: 'Campaign has already been launched'
      });
    }

    await emailSendingQueue.addBulk(jobs);

    return res.json({
      message: 'Campaign launched successfully',
      queuedJobs: jobs.length,
      campaign: updatedCampaign
    });
  } catch (error) {
    if (campaign && originalRoundRobinIndex !== undefined) {
      await Campaign.updateOne(
        {
          _id: campaign._id,
          status: 'Running'
        },
        {
          $set: {
            status: 'Draft',
            currentRoundRobinIndex: originalRoundRobinIndex
          }
        }
      ).catch(() => {});
    }

    return res.status(500).json({
      message: 'Unable to launch campaign',
      error: error.message
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  launchCampaign
};
