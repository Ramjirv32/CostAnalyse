const express = require('express');
const { ESP32, WiFiConnection } = require('../models/WiFiModels');
const Device = require('../models/Device');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all ESP32 controllers for the user
router.get('/esp32', auth, async (req, res) => {
  try {
    const esp32Controllers = await ESP32.find({ userId: req.user.id })
      .populate('connectedDevices')
      .populate({
        path: 'connectedDevices',
        populate: {
          path: 'device',
          model: 'Device'
        }
      })
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: esp32Controllers
    });
  } catch (error) {
    console.error('Error fetching ESP32 controllers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ESP32 controllers'
    });
  }
});

// Get all WiFi devices for the user
router.get('/devices', auth, async (req, res) => {
  try {
    const { status, esp32Id } = req.query;
    
    let query = { userId: req.user.id };
    if (status) query.connectionStatus = status;
    if (esp32Id) query.esp32Id = esp32Id;

    const wifiDevices = await WiFiConnection.find(query)
      .populate('device')
      .populate('esp32')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: wifiDevices
    });
  } catch (error) {
    console.error('Error fetching WiFi devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WiFi devices'
    });
  }
});

// Get WiFi devices by ESP32 controller
router.get('/esp32/:esp32Id/devices', auth, async (req, res) => {
  try {
    const { esp32Id } = req.params;

    // Verify ESP32 belongs to user
    const esp32 = await ESP32.findOne({ _id: esp32Id, userId: req.user.id });
    if (!esp32) {
      return res.status(404).json({
        success: false,
        error: 'ESP32 controller not found'
      });
    }

    const devices = await WiFiConnection.find({ esp32Id, userId: req.user.id })
      .populate('device')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        esp32,
        devices,
        stats: {
          total: devices.length,
          connected: devices.filter(d => d.connectionStatus === 'connected').length,
          pending: devices.filter(d => d.connectionStatus === 'pending_approval').length,
          rejected: devices.filter(d => d.connectionStatus === 'rejected').length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching ESP32 devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ESP32 devices'
    });
  }
});

// Add/Register new ESP32 controller
router.post('/esp32', auth, async (req, res) => {
  try {
    const {
      name,
      macAddress,
      ipAddress,
      location,
      wifiSSID,
      maxConnectedDevices
    } = req.body;

    // Check if ESP32 with this MAC already exists
    const existing = await ESP32.findOne({ macAddress });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'ESP32 with this MAC address already exists'
      });
    }

    const esp32 = new ESP32({
      name,
      macAddress,
      ipAddress,
      location,
      wifiSSID,
      maxConnectedDevices: maxConnectedDevices || 10,
      userId: req.user.id,
      status: 'pending_approval', // Require approval for new ESP32
      isApproved: false
    });

    const savedESP32 = await esp32.save();

    res.status(201).json({
      success: true,
      data: savedESP32,
      message: 'ESP32 controller registered. Pending approval.'
    });
  } catch (error) {
    console.error('Error adding ESP32:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to register ESP32 controller'
    });
  }
});

// Approve/Reject ESP32 controller
router.put('/esp32/:esp32Id/approval', auth, async (req, res) => {
  try {
    const { esp32Id } = req.params;
    const { approved, rejectionReason } = req.body;

    const esp32 = await ESP32.findOne({ _id: esp32Id, userId: req.user.id });
    if (!esp32) {
      return res.status(404).json({
        success: false,
        error: 'ESP32 controller not found'
      });
    }

    if (approved) {
      await esp32.approveESP32(req.user.id);
    } else {
      esp32.isApproved = false;
      esp32.status = 'offline';
      esp32.rejectionReason = rejectionReason;
      await esp32.save();
    }

    res.json({
      success: true,
      data: esp32,
      message: approved ? 'ESP32 approved successfully' : 'ESP32 rejected'
    });
  } catch (error) {
    console.error('Error updating ESP32 approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ESP32 approval'
    });
  }
});

// Connect device to ESP32
router.post('/connect-device', auth, async (req, res) => {
  try {
    const {
      deviceId,
      esp32Id,
      deviceMAC,
      deviceIP,
      deviceFingerprint
    } = req.body;

    // Verify device belongs to user
    const device = await Device.findOne({ _id: deviceId, userId: req.user.id });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Verify ESP32 belongs to user and is approved
    const esp32 = await ESP32.findOne({ _id: esp32Id, userId: req.user.id, isApproved: true });
    if (!esp32) {
      return res.status(404).json({
        success: false,
        error: 'ESP32 controller not found or not approved'
      });
    }

    // Check if device is already connected to any ESP32
  const existingConnection = await WiFiConnection.findOne({ 
      deviceId, 
      userId: req.user.id,
      connectionStatus: { $in: ['connected', 'pending_approval'] }
    });
    
    if (existingConnection) {
      return res.status(409).json({
        success: false,
        error: 'Device is already connected or pending approval'
      });
    }

    // Check ESP32 device limit
  const connectedCount = await WiFiConnection.countDocuments({
      esp32Id,
      connectionStatus: 'connected'
    });

    if (connectedCount >= esp32.maxConnectedDevices) {
      return res.status(400).json({
        success: false,
        error: 'ESP32 has reached maximum device limit'
      });
    }

    const wifiConnection = new WiFiConnection({
      deviceId,
      esp32Id,
      userId: req.user.id,
      deviceMAC,
      deviceIP,
      deviceFingerprint,
      connectionStatus: 'pending_approval', // Require approval
      isApproved: false
    });

    const savedConnection = await wifiConnection.save();
    await savedConnection.populate(['device', 'esp32']);

    res.status(201).json({
      success: true,
      data: savedConnection,
      message: 'Device connection request created. Pending approval.'
    });
  } catch (error) {
    console.error('Error connecting device:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to connect device'
    });
  }
});

// Approve/Reject device connection
router.put('/devices/:wifiDeviceId/approval', auth, async (req, res) => {
  try {
    const { wifiDeviceId } = req.params;
    const { approved, rejectionReason } = req.body;

    const wifiConnection = await WiFiConnection.findOne({ 
      _id: wifiDeviceId, 
      userId: req.user.id 
    }).populate(['device', 'esp32']);

    if (!wifiConnection) {
      return res.status(404).json({
        success: false,
        error: 'WiFi device connection not found'
      });
    }

    if (approved) {
      await wifiConnection.approveDevice(req.user.id);
    } else {
      await wifiConnection.rejectDevice(rejectionReason);
    }

    res.json({
      success: true,
      data: wifiConnection,
      message: approved ? 'Device approved and connected' : 'Device connection rejected'
    });
  } catch (error) {
    console.error('Error updating device approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device approval'
    });
  }
});

// Disconnect device from ESP32
router.delete('/devices/:wifiDeviceId', auth, async (req, res) => {
  try {
    const { wifiDeviceId } = req.params;

    const wifiConnection = await WiFiConnection.findOneAndDelete({
      _id: wifiDeviceId,
      userId: req.user.id
    });

    if (!wifiConnection) {
      return res.status(404).json({
        success: false,
        error: 'WiFi device connection not found'
      });
    }

    res.json({
      success: true,
      message: 'Device disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect device'
    });
  }
});

// Get pending approvals for user
router.get('/pending-approvals', auth, async (req, res) => {
  try {
    const [pendingESP32s, pendingDevices] = await Promise.all([
      ESP32.find({ 
        userId: req.user.id, 
        isApproved: false,
        status: { $ne: 'rejected' }
      }),
      WiFiConnection.find({ 
        userId: req.user.id, 
        connectionStatus: 'pending_approval' 
      }).populate(['device', 'esp32'])
    ]);

    res.json({
      success: true,
      data: {
        esp32Controllers: pendingESP32s,
        deviceConnections: pendingDevices,
        counts: {
          esp32: pendingESP32s.length,
          devices: pendingDevices.length,
          total: pendingESP32s.length + pendingDevices.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending approvals'
    });
  }
});

// Update device activity (called by ESP32)
router.put('/devices/:wifiDeviceId/activity', auth, async (req, res) => {
  try {
    const { wifiDeviceId } = req.params;
    const { signalStrength, dataTransferred, bandwidth } = req.body;

    const updateData = { lastActivity: new Date() };
    if (signalStrength !== undefined) updateData.signalStrength = signalStrength;
    if (dataTransferred) updateData.dataTransferred = dataTransferred;
    if (bandwidth) updateData.bandwidth = bandwidth;

    const wifiConnection = await WiFiConnection.findOneAndUpdate(
      { _id: wifiDeviceId, userId: req.user.id },
      updateData,
      { new: true }
    ).populate(['device', 'esp32']);

    if (!wifiConnection) {
      return res.status(404).json({
        success: false,
        error: 'WiFi device not found'
      });
    }

    res.json({
      success: true,
      data: wifiConnection
    });
  } catch (error) {
    console.error('Error updating device activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device activity'
    });
  }
});

// Get WiFi network statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const [esp32Count, totalDevices, connectedDevices, pendingDevices] = await Promise.all([
      ESP32.countDocuments({ userId: req.user.id, isApproved: true }),
      WiFiConnection.countDocuments({ userId: req.user.id }),
      WiFiConnection.countDocuments({ userId: req.user.id, connectionStatus: 'connected' }),
      WiFiConnection.countDocuments({ userId: req.user.id, connectionStatus: 'pending_approval' })
    ]);

    // Get recent activity
    const recentActivity = await WiFiConnection.find({ 
      userId: req.user.id,
      connectionStatus: 'connected'
    })
    .populate(['device', 'esp32'])
    .sort({ lastActivity: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        summary: {
          esp32Controllers: esp32Count,
          totalDevices,
          connectedDevices,
          pendingDevices,
          disconnectedDevices: totalDevices - connectedDevices - pendingDevices
        },
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching WiFi stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WiFi statistics'
    });
  }
});

// Create new WiFi device connection
router.post('/devices', auth, async (req, res) => {
  try {
    const { deviceId, esp32Id } = req.body;
    const userId = req.user.id;

    // Verify device exists and belongs to user
    const device = await Device.findOne({ _id: deviceId, userId });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Verify ESP32 exists and belongs to user
    const esp32 = await ESP32.findOne({ _id: esp32Id, userId });
    if (!esp32) {
      return res.status(404).json({
        success: false,
        error: 'ESP32 controller not found'
      });
    }

    // Check if WiFi connection already exists
    const existingConnection = await WiFiConnection.findOne({ deviceId: deviceId, userId });
    if (existingConnection) {
      return res.status(400).json({
        success: false,
        error: 'Device is already connected via WiFi'
      });
    }

    // Generate MAC and IP for the device
    const existingDevices = await WiFiConnection.find({ userId });
    const deviceIndex = existingDevices.length + 1;

    // Create WiFi device connection
    const wifiConnection = new WiFiConnection({
      userId,
      deviceId: deviceId,
      esp32Id: esp32Id,
      deviceMAC: `CC:DD:EE:FF:00:${deviceIndex.toString().padStart(2, '0')}`,
      deviceIP: `192.168.1.${150 + deviceIndex}`,
      connectionStatus: 'connected',
      signalStrength: Math.floor(Math.random() * 40) - 90, // -90 to -50 dBm
      lastActivity: new Date(),
      connectionTime: new Date(),
      isApproved: true
    });

    await wifiConnection.save();

    // Populate the response
    await wifiConnection.populate('device');
    await wifiConnection.populate('esp32');

    res.json({
      success: true,
      message: 'WiFi device connected successfully',
      data: wifiConnection
    });

  } catch (error) {
    console.error('Error creating WiFi device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect WiFi device',
      message: error.message
    });
  }
});

// Setup demo WiFi devices from existing devices
router.post('/setup-demo', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has ESP32 controllers
    const existingESP32s = await ESP32.find({ userId });
  const existingWiFiDevices = await WiFiConnection.find({ userId });
    
    if (existingESP32s.length > 0 && existingWiFiDevices.length > 0) {
      return res.json({
        success: true,
        message: 'WiFi devices already set up',
        data: {
          esp32Count: existingESP32s.length,
          wifiDeviceCount: existingWiFiDevices.length
        }
      });
    }

    // Get user's existing devices
    const userDevices = await Device.find({ userId, isActive: true });
    
    if (userDevices.length === 0) {
      return res.json({
        success: false,
        message: 'No devices found to convert to WiFi devices'
      });
    }

    // Create demo ESP32 controllers (or use existing ones)
    const esp32Controllers = [];
    const esp32Names = ['ESP32-Home-Hub', 'ESP32-Kitchen-Hub'];
    const esp32MacAddresses = ['AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02'];
    
    for (let i = 0; i < Math.min(2, Math.ceil(userDevices.length / 3)); i++) {
      const macAddress = esp32MacAddresses[i];
      
      // Check if ESP32 with this MAC address already exists
      let esp32 = await ESP32.findOne({ userId, macAddress });
      
      if (!esp32) {
        // Create new ESP32 if it doesn't exist
        esp32 = new ESP32({
          userId,
          name: esp32Names[i] || `ESP32-Hub-${i + 1}`,
          macAddress,
          ipAddress: `192.168.1.${100 + i}`,
          location: i === 0 ? 'Living Room' : 'Kitchen',
          wifiSSID: 'HomeNetwork',
          signalStrength: Math.floor(Math.random() * 30) - 70, // -70 to -40 dBm
          status: 'online',
          lastSeen: new Date(),
          isApproved: true,
          firmwareVersion: '2.1.0'
        });
        
        try {
          await esp32.save();
        } catch (saveErr) {
          // If duplicate key error occurs (e.g., global unique index existed),
          // try to recover by loading the existing document by macAddress.
          if (saveErr && saveErr.code === 11000) {
            console.warn('Duplicate ESP32 MAC during demo setup, loading existing ESP32 for MAC', macAddress);
            const existingByMac = await ESP32.findOne({ macAddress });
            if (existingByMac) {
              esp32 = existingByMac;
            } else {
              // rethrow if we cannot recover
              throw saveErr;
            }
          } else {
            throw saveErr;
          }
        }
      }
      
      esp32Controllers.push(esp32);
    }

    // Convert existing devices to WiFi devices (or use existing ones)
  const wifiDevices = [];
    for (let i = 0; i < userDevices.length; i++) {
      const device = userDevices[i];
      const esp32 = esp32Controllers[i % esp32Controllers.length]; // Distribute devices across ESP32s
      
      // Update device to link with ESP32
      device.esp32Id = esp32._id;
      device.connectionType = 'wifi';
      device.status = 'online';
      await device.save();
      
      // Check if WiFi device already exists for this device
  let wifiConnection = await WiFiConnection.findOne({ userId, deviceId: device._id });
      
      if (!wifiConnection) {
        // Create new WiFi device if it doesn't exist
        wifiConnection = new WiFiConnection({
          userId,
          deviceId: device._id,
          esp32Id: esp32._id,
          deviceMAC: `BB:CC:DD:EE:FF:${(i + 10).toString().padStart(2, '0')}`,
          deviceIP: `192.168.1.${150 + i}`,
          connectionStatus: 'connected',
          signalStrength: Math.floor(Math.random() * 40) - 90, // -90 to -50 dBm
          lastActivity: new Date(),
          connectionTime: new Date(),
          isApproved: true
        });
        
        try {
          await wifiConnection.save();
        } catch (wErr) {
          if (wErr && wErr.code === 11000) {
            console.warn('Duplicate WiFi device MAC during demo setup, loading existing connection for device', device._id);
            const existingConn = await WiFiConnection.findOne({ deviceId: device._id });
            if (existingConn) {
              wifiConnection = existingConn;
            } else {
              throw wErr;
            }
          } else {
            throw wErr;
          }
        }
      }
      
      wifiDevices.push(wifiConnection);
    }

    // AUTOMATICALLY SYNC TO WiFiEnergyDevice COLLECTION
    // This ensures energy tracking starts immediately after setup
    try {
      const { WiFiEnergyDevice } = require('../models/WiFiEnergyModels');
      
      for (const esp32 of esp32Controllers) {
        // Get devices for this ESP32
        const esp32Devices = await Device.find({ 
          userId, 
          esp32Id: esp32._id,
          isActive: true 
        });
        
        if (esp32Devices.length === 0) continue;
        
        // Check if WiFiEnergyDevice exists
        let wifiEnergyDevice = await WiFiEnergyDevice.findOne({ 
          userId, 
          esp32Id: esp32._id 
        });
        
        if (!wifiEnergyDevice) {
          // Create new WiFiEnergyDevice for energy tracking
          wifiEnergyDevice = new WiFiEnergyDevice({
            userId,
            esp32Id: esp32._id,
            esp32Name: esp32.name,
            esp32MacAddress: esp32.macAddress,
            esp32IpAddress: esp32.ipAddress,
            esp32Location: esp32.location,
            esp32Status: esp32.status
          });
        }
        
        // Update connected devices for energy tracking
        wifiEnergyDevice.connectedDevices = esp32Devices.map(device => ({
          deviceId: device._id,
          deviceName: device.name,
          deviceType: device.type,
          powerRating: device.powerRating,
          connectionStatus: 'connected',
          deviceMAC: device.macAddress || `AUTO:${device._id.toString().slice(-8)}`,
          deviceIP: device.ipAddress || '192.168.1.100',
          connectedAt: new Date(),
          lastActivity: new Date(),
          isActive: true
        }));
        
        await wifiEnergyDevice.save();
      }
      
      console.log('✅ WiFi Energy tracking initialized for demo devices');
    } catch (syncError) {
      console.error('⚠️  Failed to sync WiFi energy devices (non-critical):', syncError.message);
    }

    res.json({
      success: true,
      message: `Successfully set up ${esp32Controllers.length} ESP32 controllers and ${wifiDevices.length} WiFi devices with energy tracking`,
      data: {
        esp32Controllers,
        wifiDevices: wifiDevices.length,
        esp32Count: esp32Controllers.length
      }
    });

  } catch (error) {
    console.error('Error setting up WiFi demo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set up WiFi devices',
      message: error.message
    });
  }
});

module.exports = router;