const mongoose = require('mongoose');

const wifiDeviceSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true,
    maxlength: [100, 'Device name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Device must belong to a user']
  },
  
  // Device Type
  deviceMode: {
    type: String,
    enum: ['esp32', 'standalone'],
    required: true,
    default: 'standalone'
  },
  
  // WiFi Information
  ssid: {
    type: String,
    required: [true, 'SSID is required'],
    trim: true
  },
  bssid: {
    type: String,
    trim: true
  },
  signalStrength: {
    type: Number, // dBm
    default: -100
  },
  channel: {
    type: Number,
    min: 1,
    max: 165
  },
  frequency: {
    type: Number // MHz
  },
  security: {
    type: String,
    enum: ['open', 'wep', 'wpa', 'wpa2', 'wpa3'],
    default: 'wpa2'
  },
  
  // Network Configuration
  ipAddress: {
    type: String,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Please enter a valid IP address']
  },
  macAddress: {
    type: String,
    match: [/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Please enter a valid MAC address']
  },
  gateway: {
    type: String
  },
  subnet: {
    type: String
  },
  
  // ESP32 Specific
  esp32Config: {
    apiEndpoint: {
      type: String // e.g., http://192.168.1.100/api
    },
    apiKey: {
      type: String
    },
    connectedDevices: [{
      pin: Number,
      deviceType: String,
      name: String,
      state: {
        type: String,
        enum: ['on', 'off'],
        default: 'off'
      },
      powerRating: {
        type: Number, // Watts
        default: 0
      },
      currentPower: {
        type: Number, // Current power consumption in Watts
        default: 0
      }
    }]
  },
  
  // Standalone WiFi Device
  standaloneConfig: {
    apiEndpoint: {
      type: String
    },
    apiKey: {
      type: String
    },
    protocol: {
      type: String,
      enum: ['http', 'https', 'mqtt', 'coap'],
      default: 'http'
    },
    port: {
      type: Number,
      default: 80
    },
    powerRating: {
      type: Number, // Watts
      default: 0
    },
    currentPower: {
      type: Number, // Current power consumption in Watts
      default: 0
    }
  },
  
  // Power Consumption & Cost Tracking
  powerTracking: {
    dailyUsage: [{
      date: {
        type: Date,
        default: Date.now
      },
      usage: {
        type: Number, // kWh
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      }
    }],
    weeklyUsage: [{
      weekStart: {
        type: Date
      },
      usage: {
        type: Number, // kWh
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      }
    }],
    monthlyUsage: [{
      month: {
        type: String // YYYY-MM format
      },
      usage: {
        type: Number, // kWh
        default: 0
      },
      cost: {
        type: Number,
        default: 0
      }
    }],
    totalUsage: {
      type: Number, // kWh
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    }
  },
  
  // Cost Configuration
  costPerKwh: {
    type: Number,
    default: 0.20 // Default $0.20 per kWh
  },
  
  // Device Status
  status: {
    type: String,
    enum: ['online', 'offline', 'discovering', 'pairing', 'error'],
    default: 'offline'
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  isPaired: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  
  // Device Capabilities
  capabilities: [{
    type: String,
    enum: ['switch', 'dimmer', 'rgb', 'temperature', 'humidity', 'motion', 'door', 'custom']
  }],
  
  // Control State
  currentState: {
    power: {
      type: Boolean,
      default: false
    },
    brightness: {
      type: Number,
      min: 0,
      max: 100
    },
    color: {
      r: Number,
      g: Number,
      b: Number
    },
    temperature: Number,
    humidity: Number,
    customData: mongoose.Schema.Types.Mixed
  },
  
  // Discovery Information
  discoveredAt: {
    type: Date,
    default: Date.now
  },
  pairedAt: {
    type: Date
  },
  
  // Metadata
  manufacturer: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  firmwareVersion: {
    type: String,
    default: '1.0.0'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Activity Log
  activityLog: [{
    action: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
wifiDeviceSchema.index({ userId: 1, ssid: 1 });
wifiDeviceSchema.index({ status: 1 });
wifiDeviceSchema.index({ deviceMode: 1 });
wifiDeviceSchema.index({ isPaired: 1 });
wifiDeviceSchema.index({ macAddress: 1 });

// Virtual for signal quality
wifiDeviceSchema.virtual('signalQuality').get(function() {
  if (this.signalStrength >= -50) return 'excellent';
  if (this.signalStrength >= -60) return 'good';
  if (this.signalStrength >= -70) return 'fair';
  return 'poor';
});

// Instance method to update status
wifiDeviceSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  this.lastSeen = new Date();
  
  if (newStatus === 'online') {
    this.isConnected = true;
  } else if (newStatus === 'offline') {
    this.isConnected = false;
  }
  
  return this.save();
};

// Instance method to log activity
wifiDeviceSchema.methods.logActivity = function(action, details = {}) {
  this.activityLog.push({
    action,
    timestamp: new Date(),
    details
  });
  
  // Keep only last 100 activity logs
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
  
  return this.save();
};

// Instance method to update device state
wifiDeviceSchema.methods.updateState = function(stateUpdate) {
  this.currentState = { ...this.currentState, ...stateUpdate };
  this.lastSeen = new Date();
  return this.save();
};

// Static method to find devices by user
wifiDeviceSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ name: 1 });
};

// Static method to find online devices
wifiDeviceSchema.statics.findOnline = function(userId) {
  return this.find({ userId, status: 'online' }).sort({ name: 1 });
};

// Static method to find by device mode
wifiDeviceSchema.statics.findByMode = function(userId, mode) {
  return this.find({ userId, deviceMode: mode }).sort({ name: 1 });
};

// Instance method to add power usage record
wifiDeviceSchema.methods.addPowerUsage = function(usageKwh, period = 'daily') {
  const cost = usageKwh * this.costPerKwh;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (period === 'daily') {
    const existingRecord = this.powerTracking.dailyUsage.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    if (existingRecord) {
      existingRecord.usage += usageKwh;
      existingRecord.cost += cost;
    } else {
      this.powerTracking.dailyUsage.push({
        date: today,
        usage: usageKwh,
        cost: cost
      });
    }
  }
  
  // Update totals
  this.powerTracking.totalUsage += usageKwh;
  this.powerTracking.totalCost += cost;
  
  return this.save();
};

// Instance method to calculate current power consumption
wifiDeviceSchema.methods.calculateCurrentPower = function() {
  let totalPower = 0;
  
  if (this.deviceMode === 'esp32' && this.esp32Config.connectedDevices) {
    this.esp32Config.connectedDevices.forEach(device => {
      if (device.state === 'on') {
        totalPower += device.currentPower || device.powerRating || 0;
      }
    });
  } else if (this.deviceMode === 'standalone') {
    if (this.currentState.power) {
      totalPower = this.standaloneConfig.currentPower || this.standaloneConfig.powerRating || 0;
    }
  }
  
  return totalPower;
};

// Virtual for today's usage
wifiDeviceSchema.virtual('todayUsage').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayRecord = this.powerTracking.dailyUsage.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });
  
  return todayRecord ? todayRecord.usage : 0;
});

// Virtual for today's cost
wifiDeviceSchema.virtual('todayCost').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayRecord = this.powerTracking.dailyUsage.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });
  
  return todayRecord ? todayRecord.cost : 0;
});

module.exports = mongoose.model('WiFiDevice', wifiDeviceSchema);
