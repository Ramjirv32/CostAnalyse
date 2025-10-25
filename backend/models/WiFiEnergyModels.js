const mongoose = require('mongoose');

// WiFi Energy Devices Collection - Store ESP32 with connected devices
const wifiEnergyDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  esp32Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ESP32',
    required: true
  },
  esp32Name: {
    type: String,
    required: true
  },
  esp32MacAddress: String,
  esp32IpAddress: String,
  esp32Location: String,
  esp32Status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'online'
  },
  connectedDevices: [{
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true
    },
    deviceName: {
      type: String,
      required: true
    },
    deviceType: {
      type: String,
      enum: ['light', 'fan', 'ac', 'tv', 'heater', 'camera', 'sensor', 'appliance', 'other'],
      default: 'other'
    },
    powerRating: {
      type: Number,
      required: true // Watts
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'pending_approval'],
      default: 'connected'
    },
    deviceMAC: String,
    deviceIP: String,
    signalStrength: Number, // dBm
    connectedAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  totalConnectedDevices: {
    type: Number,
    default: 0
  },
  totalPowerRating: {
    type: Number,
    default: 0 // Sum of all connected devices power
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
wifiEnergyDeviceSchema.index({ userId: 1, esp32Id: 1 });
wifiEnergyDeviceSchema.index({ 'connectedDevices.deviceId': 1 });

// Pre-save middleware to calculate totals
wifiEnergyDeviceSchema.pre('save', function(next) {
  const activeDevices = this.connectedDevices.filter(d => d.isActive && d.connectionStatus === 'connected');
  this.totalConnectedDevices = activeDevices.length;
  this.totalPowerRating = activeDevices.reduce((sum, device) => sum + (device.powerRating || 0), 0);
  this.lastUpdated = new Date();
  next();
});

// WiFi Energy Analytics Collection - Store energy calculations for WiFi devices
const wifiEnergyAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  esp32Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ESP32',
    required: true,
    index: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true
  },
  wifiEnergyDeviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WiFiEnergyDevice'
  },
  // Device Info
  deviceName: String,
  deviceType: String,
  esp32Name: String,
  esp32Location: String,
  
  // Energy Data
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  powerRating: {
    type: Number,
    required: true // Watts
  },
  currentPower: {
    type: Number,
    default: 0 // Current power consumption in Watts
  },
  voltage: {
    type: Number,
    default: 220 // Volts
  },
  current: {
    type: Number,
    default: 0 // Amperes
  },
  frequency: {
    type: Number,
    default: 50 // Hz
  },
  
  // Energy Consumption
  energyConsumed: {
    type: Number,
    default: 0 // kWh
  },
  dailyConsumption: {
    type: Number,
    default: 0 // kWh per day
  },
  monthlyConsumption: {
    type: Number,
    default: 0 // kWh per month
  },
  
  // Cost Calculations (based on user's currency preferences)
  currency: {
    type: String,
    default: 'USD'
  },
  currencySymbol: {
    type: String,
    default: '$'
  },
  electricityRate: {
    type: Number,
    default: 0.12 // Per kWh
  },
  conversionRate: {
    type: Number,
    default: 1 // Currency conversion rate
  },
  
  // Calculated Costs
  costPerSecond: {
    type: Number,
    default: 0
  },
  costPerHour: {
    type: Number,
    default: 0
  },
  costPerDay: {
    type: Number,
    default: 0
  },
  costPerMonth: {
    type: Number,
    default: 0
  },
  costPerYear: {
    type: Number,
    default: 0
  },
  
  // Connection Status
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected'],
    default: 'connected'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
wifiEnergyAnalyticsSchema.index({ userId: 1, timestamp: -1 });
wifiEnergyAnalyticsSchema.index({ esp32Id: 1, timestamp: -1 });
wifiEnergyAnalyticsSchema.index({ deviceId: 1, timestamp: -1 });
wifiEnergyAnalyticsSchema.index({ userId: 1, deviceId: 1, timestamp: -1 });

// Method to calculate costs based on power and user preferences
wifiEnergyAnalyticsSchema.methods.calculateCosts = function(userCurrencyPrefs) {
  const powerKW = this.currentPower / 1000; // Convert to kW
  
  // Use user's currency preferences or defaults
  const rate = userCurrencyPrefs?.electricityRate || this.electricityRate;
  const conversionRate = userCurrencyPrefs?.conversionRates?.[userCurrencyPrefs.currency] || this.conversionRate;
  
  // Calculate energy consumption
  this.energyConsumed = powerKW; // Current kW
  this.dailyConsumption = powerKW * 24; // kWh per day
  this.monthlyConsumption = powerKW * 24 * 30; // kWh per month
  
  // Calculate costs
  this.costPerSecond = (powerKW * rate * conversionRate) / 3600;
  this.costPerHour = powerKW * rate * conversionRate;
  this.costPerDay = powerKW * 24 * rate * conversionRate;
  this.costPerMonth = powerKW * 24 * 30 * rate * conversionRate;
  this.costPerYear = powerKW * 24 * 365 * rate * conversionRate;
  
  // Update currency info
  if (userCurrencyPrefs) {
    this.currency = userCurrencyPrefs.currency;
    this.currencySymbol = userCurrencyPrefs.currencySymbol;
    this.electricityRate = rate;
    this.conversionRate = conversionRate;
  }
  
  this.calculatedAt = new Date();
  
  return this;
};

// Static method to get analytics for a user
wifiEnergyAnalyticsSchema.statics.getUserAnalytics = function(userId, startDate, endDate) {
  const query = { userId, connectionStatus: 'connected' };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('deviceId', 'name type powerRating status')
    .populate('esp32Id', 'name location ipAddress');
};

// Static method to get ESP32 analytics
wifiEnergyAnalyticsSchema.statics.getESP32Analytics = function(esp32Id, startDate, endDate) {
  const query = { esp32Id, connectionStatus: 'connected' };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('deviceId', 'name type powerRating status');
};

// Export models with conditional creation to avoid OverwriteModelError
const WiFiEnergyDevice = mongoose.models.WiFiEnergyDevice || mongoose.model('WiFiEnergyDevice', wifiEnergyDeviceSchema);
const WiFiEnergyAnalytics = mongoose.models.WiFiEnergyAnalytics || mongoose.model('WiFiEnergyAnalytics', wifiEnergyAnalyticsSchema);

module.exports = {
  WiFiEnergyDevice,
  WiFiEnergyAnalytics
};
