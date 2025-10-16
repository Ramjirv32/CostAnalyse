const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['light', 'fan', 'ac', 'tv', 'heater', 'camera', 'sensor', 'appliance', 'other'],
    default: 'other'
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  powerRating: {
    type: Number, // Watts
    required: [true, 'Power rating is required'],
    min: [0.1, 'Power rating must be at least 0.1W'],
    max: [50000, 'Power rating cannot exceed 50kW']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance', 'error'],
    default: 'offline'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Usage tracking
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
      type: Number, // Cost in currency
      default: 0
    }
  }],
  totalUsage: {
    type: Number, // kWh
    default: 0
  },
  totalCost: {
    type: Number, // Total cost
    default: 0
  },
  // Device settings
  autoControl: {
    type: Boolean,
    default: false
  },
  schedule: [{
    time: {
      type: String, // HH:MM format
      required: function() { return this.autoControl; }
    },
    action: {
      type: String,
      enum: ['on', 'off'],
      required: function() { return this.autoControl; }
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  }],
  // Monitoring
  lastSeen: {
    type: Date,
    default: Date.now
  },
  batteryLevel: {
    type: Number, // 0-100
    min: 0,
    max: 100,
    default: null
  },
  temperature: {
    type: Number,
    default: null
  },
  // Firmware/Software
  firmwareVersion: {
    type: String,
    default: '1.0.0'
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  // Connectivity
  ipAddress: {
    type: String,
    match: [/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Please enter a valid IP address']
  },
  macAddress: {
    type: String,
    match: [/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Please enter a valid MAC address']
  },
  connectionType: {
    type: String,
    enum: ['wifi', 'ethernet', 'zigbee', 'bluetooth', 'cellular'],
    default: 'wifi'
  },
  // Alerts and notifications
  alerts: [{
    type: {
      type: String,
      enum: ['power', 'temperature', 'connectivity', 'maintenance', 'usage']
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    }
  }],
  // Energy efficiency
  energyClass: {
    type: String,
    enum: ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'],
    default: 'C'
  },
  // Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
deviceSchema.index({ userId: 1, name: 1 }); // Compound index for user's devices
deviceSchema.index({ status: 1 }); // Status queries
deviceSchema.index({ 'schedule.time': 1 }); // Schedule queries
deviceSchema.index({ lastSeen: -1 }); // Recent activity
deviceSchema.index({ tags: 1 }); // Tag searches

// Virtual for current day's usage
deviceSchema.virtual('todayUsage').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = this.dailyUsage.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  return todayRecord ? todayRecord.usage : 0;
});

// Virtual for current day's cost
deviceSchema.virtual('todayCost').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayRecord = this.dailyUsage.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  return todayRecord ? todayRecord.cost : 0;
});

// Pre-save middleware to update total usage
deviceSchema.pre('save', function(next) {
  if (this.isModified('dailyUsage')) {
    this.totalUsage = this.dailyUsage.reduce((sum, record) => sum + record.usage, 0);
    this.totalCost = this.dailyUsage.reduce((sum, record) => sum + record.cost, 0);
  }
  next();
});

// Static method to get devices by user
deviceSchema.statics.findByUser = function(userId) {
  return this.find({ userId, isActive: true }).sort({ name: 1 });
};

// Static method to get online devices
deviceSchema.statics.findOnline = function() {
  return this.find({ status: 'online', isActive: true }).populate('userId', 'name email');
};

// Static method to get devices needing maintenance
deviceSchema.statics.findNeedingMaintenance = function() {
  return this.find({ status: 'maintenance' }).populate('userId', 'name email');
};

// Instance method to add usage record
deviceSchema.methods.addUsageRecord = function(usage, cost) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingRecord = this.dailyUsage.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime();
  });

  if (existingRecord) {
    existingRecord.usage += usage;
    existingRecord.cost += cost;
  } else {
    this.dailyUsage.push({
      date: today,
      usage: usage,
      cost: cost
    });
  }

  return this.save();
};

// Instance method to update status
deviceSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  this.lastSeen = new Date();

  if (newStatus === 'online') {
    // Clear any connectivity alerts when device comes online
    this.alerts = this.alerts.filter(alert => alert.type !== 'connectivity');
  }

  return this.save();
};

// Instance method to add alert
deviceSchema.methods.addAlert = function(type, message, severity = 'medium') {
  this.alerts.push({
    type,
    message,
    severity,
    timestamp: new Date()
  });

  return this.save();
};

module.exports = mongoose.model('Device', deviceSchema);
