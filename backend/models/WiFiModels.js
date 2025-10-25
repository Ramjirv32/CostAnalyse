const mongoose = require('mongoose');

// ESP32 Controller Schema
const esp32Schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'ESP32 name is required'],
    trim: true,
    maxlength: [100, 'ESP32 name cannot exceed 100 characters']
  },
  macAddress: {
    type: String,
    required: [true, 'MAC address is required'],
    // uniqueness should be enforced per-user via a compound index below
    trim: true,
    match: [/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format']
  },
  ipAddress: {
    type: String,
    trim: true,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address format']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ESP32 must belong to a user']
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
  firmwareVersion: {
    type: String,
    trim: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  wifiSSID: {
    type: String,
    trim: true
  },
  signalStrength: {
    type: Number, // RSSI in dBm
    min: [-100, 'Signal strength cannot be less than -100 dBm'],
    max: [0, 'Signal strength cannot be more than 0 dBm']
  },
  maxConnectedDevices: {
    type: Number,
    default: 10,
    min: [1, 'Must support at least 1 device'],
    max: [50, 'Cannot exceed 50 devices']
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// WiFi Connected Device Schema
const wifiDeviceSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device reference is required']
  },
  esp32Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ESP32',
    required: [true, 'ESP32 reference is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  deviceMAC: {
    type: String,
    required: [true, 'Device MAC address is required'],
    trim: true,
    match: [/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC address format']
  },
  deviceIP: {
    type: String,
    trim: true,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Invalid IP address format']
  },
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected', 'pending_approval', 'rejected'],
    default: 'pending_approval'
  },
  connectionTime: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  signalStrength: {
    type: Number, // RSSI in dBm
    min: [-100, 'Signal strength cannot be less than -100 dBm'],
    max: [0, 'Signal strength cannot be more than 0 dBm']
  },
  dataTransferred: {
    upload: { type: Number, default: 0 }, // Bytes
    download: { type: Number, default: 0 } // Bytes
  },
  bandwidth: {
    current: { type: Number, default: 0 }, // Mbps
    peak: { type: Number, default: 0 } // Mbps
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectedReason: {
    type: String,
    trim: true
  },
  deviceFingerprint: {
    manufacturer: String,
    model: String,
    os: String,
    userAgent: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Virtuals for ESP32
esp32Schema.virtual('connectedDevicesCount', {
  ref: 'WiFiConnection',
  localField: '_id',
  foreignField: 'esp32Id',
  count: true,
  match: { connectionStatus: 'connected' }
});


esp32Schema.virtual('connectedDevices', {
  ref: 'WiFiConnection',
  localField: '_id',
  foreignField: 'esp32Id',
  match: { connectionStatus: 'connected' }
});


// Virtuals for WiFi Device
wifiDeviceSchema.virtual('device', {
  ref: 'Device',
  localField: 'deviceId',
  foreignField: '_id',
  justOne: true
});


wifiDeviceSchema.virtual('esp32', {
  ref: 'ESP32',
  localField: 'esp32Id',
  foreignField: '_id',
  justOne: true
});


// Indexes for performance
// Make MAC addresses unique per user (compound unique index). Previously macAddress
// had a global unique constraint which caused duplicate-key errors across different users
// when demo data reused the same MAC addresses. Use compound unique index instead.
esp32Schema.index({ userId: 1, macAddress: 1 }, { unique: true });
esp32Schema.index({ status: 1, isApproved: 1 });
wifiDeviceSchema.index({ userId: 1, esp32Id: 1 });
wifiDeviceSchema.index({ connectionStatus: 1, isApproved: 1 });


// Methods for ESP32
esp32Schema.methods.approveESP32 = function(approverId) {
  this.isApproved = true;
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  this.status = 'online';
  return this.save();
};


esp32Schema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save({ validateBeforeSave: false });
};


// Methods for WiFi Device
wifiDeviceSchema.methods.approveDevice = function(approverId) {
  this.isApproved = true;
  this.connectionStatus = 'connected';
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  return this.save();
};


wifiDeviceSchema.methods.rejectDevice = function(reason) {
  this.isApproved = false;
  this.connectionStatus = 'rejected';
  this.rejectedReason = reason;
  return this.save();
};


wifiDeviceSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save({ validateBeforeSave: false });
};

// Check if models already exist to prevent OverwriteModelError
const ESP32 = mongoose.models.ESP32 || mongoose.model('ESP32', esp32Schema);
const WiFiConnection = mongoose.models.WiFiConnection || mongoose.model('WiFiConnection', wifiDeviceSchema, 'wifiConnectedDevices');

module.exports = {
  ESP32,
  WiFiConnection
};