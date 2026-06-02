const Domain = require('../models/Domain');

const addDomain = async (req, res) => {
  try {
    const {
      domainName,
      senderEmail,
      senderName,
      dailyLimit,
      status
    } = req.body;

    const domain = await Domain.create({
      domainName,
      senderEmail,
      senderName,
      dailyLimit,
      status
    });

    return res.status(201).json({
      domain
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Unable to add domain',
      error: error.message
    });
  }
};

const getDomains = async (req, res) => {
  try {
    const domains = await Domain.find().sort({ createdAt: -1 });

    return res.json({
      domains
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to retrieve domains',
      error: error.message
    });
  }
};

module.exports = {
  addDomain,
  getDomains
};
