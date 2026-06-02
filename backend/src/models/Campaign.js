const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  },
  {
    _id: true
  }
);

const delaySettingsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['fixed', 'random'],
      required: true
    },
    fixedValue: {
      type: Number,
      default: 0,
      min: 0
    },
    min: {
      type: Number,
      default: 0,
      min: 0
    },
    max: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    _id: false
  }
);

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    htmlContent: {
      type: String,
      required: true
    },
    recipients: {
      type: [recipientSchema],
      default: []
    },
    senderRotationMode: {
      type: String,
      enum: ['Fixed', 'Random', 'Round-Robin'],
      required: true
    },
    selectedDomains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Domain',
        required: true
      }
    ],
    delaySettings: {
      type: delaySettingsSchema,
      required: true
    },
    currentRoundRobinIndex: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['Draft', 'Running', 'Completed'],
      default: 'Draft'
    }
  },
  {
    timestamps: true
  }
);

campaignSchema.pre('validate', function validateDelaySettings(next) {
  if (
    this.delaySettings &&
    this.delaySettings.type === 'random' &&
    this.delaySettings.min > this.delaySettings.max
  ) {
    this.invalidate(
      'delaySettings.max',
      'delaySettings.max must be greater than or equal to delaySettings.min'
    );
  }

  next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
