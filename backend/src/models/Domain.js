const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema(
  {
    domainName: {
      type: String,
      required: true,
      trim: true
    },
    senderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    dailyLimit: {
      type: Number,
      required: true,
      min: 1
    },
    dailyUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    usageDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10)
    },
    totalEmailsSent: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Active', 'Disabled', 'Pending Verification'],
      default: 'Pending Verification'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Domain', domainSchema);
