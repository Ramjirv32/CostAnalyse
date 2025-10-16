const mongoose = require('mongoose');

const energyEstimateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['regular', 'wifi', 'esp32'],
    default: 'regular'
  },
  // Power measurements
  currentPower: {
    type: Number,
    required: true,
    min: 0
  },
  powerRating: {
    type: Number,
    required: true
  },
  // Electrical parameters
  voltage: {
    type: Number,
    default: 220
  },
  current: {
    type: Number,
    default: 0
  },
  frequency: {
    type: Number,
    default: 50
  },
  // Cost calculations
  costPerKwh: {
    type: Number,
    default: 0.20
  },
  instantCost: {
    type: Number
  },
  costPerSecond: {
    type: Number
  },
  costPerHour: {
    type: Number
  },
  costPerDay: {
    type: Number
  },
  hourlyUsage: {
    type: Number
  },
  hourlyCost: {
    type: Number
  },
  dailyUsage: {
    type: Number
  },
  dailyCost: {
    type: Number
  },
  monthlyUsage: {
    type: Number
  },
  monthlyCost: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    type: String
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
energyEstimateSchema.index({ userId: 1, deviceId: 1, timestamp: -1 });
energyEstimateSchema.index({ userId: 1, timestamp: -1 });

// TTL index to automatically delete old records after 30 days
energyEstimateSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

// Pre-save middleware to calculate costs
energyEstimateSchema.pre('save', function(next) {
  // Calculate instant cost per second: (watts / 1000) * costPerKwh / 3600
  this.instantCost = (this.currentPower / 1000) * this.costPerKwh / 3600;
  next();
});

// Static method to get latest estimates for a user
energyEstimateSchema.statics.getLatestByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('deviceId', 'name type powerRating status');
};

// Static method to get device history
energyEstimateSchema.statics.getDeviceHistory = function(userId, deviceId, hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    userId, 
    deviceId,
    timestamp: { $gte: startTime }
  }).sort({ timestamp: -1 });
};

// Static method to calculate aggregated stats
energyEstimateSchema.statics.getAggregatedStats = async function(userId, period = 'day') {
  let startTime;
  const now = new Date();
  
  switch(period) {
    case 'hour':
      startTime = new Date(now - 60 * 60 * 1000);
      break;
    case 'day':
      startTime = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startTime = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startTime = new Date(now.setHours(0, 0, 0, 0));
  }

  const estimates = await this.find({
    userId,
    timestamp: { $gte: startTime }
  });

  const totalUsage = estimates.reduce((sum, est) => {
    // Convert watts to kWh: (watts * seconds) / (1000 * 3600)
    return sum + (est.currentPower / 1000 / 3600);
  }, 0);

  const totalCost = estimates.reduce((sum, est) => sum + est.instantCost, 0);

  return {
    period,
    startTime,
    endTime: new Date(),
    totalUsage: totalUsage.toFixed(4),
    totalCost: totalCost.toFixed(4),
    recordCount: estimates.length
  };
};

module.exports = mongoose.model('EnergyEstimate', energyEstimateSchema);
