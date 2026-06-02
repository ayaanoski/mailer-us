const express = require('express');
const {
  register,
  login,
  protect,
  adminOnly
} = require('../controllers/authController');
const {
  addDomain,
  getDomains
} = require('../controllers/domainController');
const {
  createCampaign,
  getCampaigns,
  launchCampaign
} = require('../controllers/campaignController');

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.post('/domains', protect, adminOnly, addDomain);
router.get('/domains', protect, getDomains);

router.post('/campaigns', protect, createCampaign);
router.get('/campaigns', protect, getCampaigns);
router.post('/campaigns/:id/launch', protect, launchCampaign);

module.exports = router;
