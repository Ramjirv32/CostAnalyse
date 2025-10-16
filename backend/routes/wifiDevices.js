const express = require('express');
const WiFiDevice = require('../models/WiFiDevice');
const wifiScanner = require('../services/wifiScanner');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ==================== WiFi Network Scanning ====================

/**
 * Scan for available WiFi networks
 * GET /api/wifi/scan
 */
router.get('/scan', auth, async (req, res) => {
  try {
    const networks = await wifiScanner.scanNetworks();
    
    res.json({
      success: true,
      data: networks,
      count: networks.length,
      message: 'WiFi scan completed successfully'
    });
  } catch (error) {
    console.error('WiFi scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan WiFi networks',
      details: error.message
    });
  }
});

/**
 * Get scanning status
 * GET /api/wifi/scan/status
 */
router.get('/scan/status', auth, async (req, res) => {
  try {
    const isScanning = wifiScanner.getScanningStatus();
    const networks = wifiScanner.getDiscoveredNetworks();
    
    res.json({
      success: true,
      data: {
        isScanning,
        networksFound: networks.length,
        networks
      }
    });
  } catch (error) {
    console.error('Scan status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get scan status'
    });
  }
});

// ==================== Device Discovery ====================

/**
 * Discover IoT devices on network
 * POST /api/wifi/discover
 */
router.post('/discover', auth, async (req, res) => {
  try {
    const { networkSSID } = req.body;
    
    const devices = await wifiScanner.discoverDevices(networkSSID);
    
    res.json({
      success: true,
      data: devices,
      count: devices.length,
      message: 'Device discovery completed successfully'
    });
  } catch (error) {
    console.error('Device discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover devices',
      details: error.message
    });
  }
});

/**
 * Get discovered devices
 * GET /api/wifi/discovered
 */
router.get('/discovered', auth, async (req, res) => {
  try {
    const devices = wifiScanner.getDiscoveredDevices();
    
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Get discovered devices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get discovered devices'
    });
  }
});

// ==================== Device Pairing ====================

/**
 * Pair with a discovered device
 * POST /api/wifi/pair
 */
router.post('/pair', auth, async (req, res) => {
  try {
    const { deviceInfo, password } = req.body;
    
    if (!deviceInfo || !deviceInfo.ssid) {
      return res.status(400).json({
        success: false,
        error: 'Device information is required'
      });
    }
    
    // Pair with device
    const pairingResult = await wifiScanner.pairDevice(deviceInfo);
    
    // Create WiFi device record
    const wifiDevice = new WiFiDevice({
      name: deviceInfo.name || deviceInfo.ssid,
      userId: req.user.id,
      deviceMode: deviceInfo.deviceMode || 'standalone',
      ssid: deviceInfo.ssid,
      bssid: deviceInfo.macAddress,
      ipAddress: deviceInfo.ipAddress,
      macAddress: deviceInfo.macAddress,
      signalStrength: deviceInfo.signalStrength || -70,
      manufacturer: deviceInfo.manufacturer,
      model: deviceInfo.model,
      capabilities: deviceInfo.capabilities || [],
      status: 'online',
      isPaired: true,
      pairedAt: new Date()
    });
    
    // Set device-specific configuration
    if (deviceInfo.deviceMode === 'esp32') {
      wifiDevice.esp32Config = {
        apiEndpoint: pairingResult.apiEndpoint,
        apiKey: pairingResult.apiKey,
        connectedDevices: deviceInfo.connectedDevices || []
      };
      // Initialize power tracking
      wifiDevice.powerTracking = {
        dailyUsage: [],
        weeklyUsage: [],
        monthlyUsage: [],
        totalUsage: 0,
        totalCost: 0
      };
    } else {
      wifiDevice.standaloneConfig = {
        apiEndpoint: pairingResult.apiEndpoint,
        apiKey: pairingResult.apiKey,
        protocol: 'http',
        port: 80,
        powerRating: deviceInfo.powerRating || 0,
        currentPower: deviceInfo.currentPower || 0
      };
      // Initialize power tracking
      wifiDevice.powerTracking = {
        dailyUsage: [],
        weeklyUsage: [],
        monthlyUsage: [],
        totalUsage: 0,
        totalCost: 0
      };
    }
    
    const savedDevice = await wifiDevice.save();
    
    res.status(201).json({
      success: true,
      data: savedDevice,
      message: 'Device paired successfully'
    });
  } catch (error) {
    console.error('Device pairing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pair device',
      details: error.message
    });
  }
});

// ==================== Device Management ====================

/**
 * Get all WiFi devices for user
 * GET /api/wifi/devices
 */
router.get('/devices', auth, async (req, res) => {
  try {
    const { mode } = req.query;
    
    let devices;
    if (mode) {
      devices = await WiFiDevice.findByMode(req.user.id, mode);
    } else {
      devices = await WiFiDevice.findByUser(req.user.id);
    }
    
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Get WiFi devices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WiFi devices'
    });
  }
});

/**
 * Get single WiFi device
 * GET /api/wifi/devices/:id
 */
router.get('/devices/:id', auth, async (req, res) => {
  try {
    const device = await WiFiDevice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Get WiFi device error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to get device'
    });
  }
});

/**
 * Update WiFi device
 * PUT /api/wifi/devices/:id
 */
router.put('/devices/:id', auth, async (req, res) => {
  try {
    const device = await WiFiDevice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'tags', 'notes'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        device[field] = req.body[field];
      }
    });
    
    const updatedDevice = await device.save();
    
    res.json({
      success: true,
      data: updatedDevice,
      message: 'Device updated successfully'
    });
  } catch (error) {
    console.error('Update WiFi device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device'
    });
  }
});

/**
 * Delete WiFi device
 * DELETE /api/wifi/devices/:id
 */
router.delete('/devices/:id', auth, async (req, res) => {
  try {
    const device = await WiFiDevice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Delete WiFi device error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete device'
    });
  }
});

// ==================== Device Control ====================

/**
 * Control WiFi device
 * POST /api/wifi/devices/:id/control
 */
router.post('/devices/:id/control', auth, async (req, res) => {
  try {
    const { command, params } = req.body;
    
    const device = await WiFiDevice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    if (!device.isPaired) {
      return res.status(400).json({
        success: false,
        error: 'Device is not paired'
      });
    }
    
    let result;
    
    // Send command based on device mode
    if (device.deviceMode === 'esp32') {
      result = await wifiScanner.sendESP32Command(device.ipAddress, {
        command,
        params
      });
    } else {
      result = await wifiScanner.sendStandaloneCommand(device.ipAddress, {
        command,
        params
      });
    }
    
    // Update device state
    if (params.power !== undefined) {
      device.currentState.power = params.power;
    }
    if (params.brightness !== undefined) {
      device.currentState.brightness = params.brightness;
    }
    
    // Log activity
    await device.logActivity(command, params);
    await device.save();
    
    res.json({
      success: true,
      data: {
        device: device,
        commandResult: result
      },
      message: 'Command executed successfully'
    });
  } catch (error) {
    console.error('Device control error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control device',
      details: error.message
    });
  }
});

/**
 * Control ESP32 connected device
 * POST /api/wifi/devices/:id/esp32/control
 */
router.post('/devices/:id/esp32/control', auth, async (req, res) => {
  try {
    const { pin, action, value } = req.body;
    
    const device = await WiFiDevice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    if (device.deviceMode !== 'esp32') {
      return res.status(400).json({
        success: false,
        error: 'Device is not an ESP32'
      });
    }
    
    // Send command to ESP32
    const result = await wifiScanner.sendESP32Command(device.ipAddress, {
      pin,
      action,
      value
    });
    
    // Update connected device state
    const connectedDevice = device.esp32Config.connectedDevices.find(d => d.pin === pin);
    if (connectedDevice) {
      connectedDevice.state = action === 'on' ? 'on' : 'off';
      // Update current power based on state
      if (action === 'on') {
        connectedDevice.currentPower = connectedDevice.powerRating || 0;
      } else {
        connectedDevice.currentPower = 0;
      }
    }
    
    await device.logActivity(`ESP32 Control - Pin ${pin}`, { action, value });
    await device.save();
    
    res.json({
      success: true,
      data: {
        device: device,
        commandResult: result
      },
      message: 'ESP32 command executed successfully'
    });
  } catch (error) {
    console.error('ESP32 control error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control ESP32 device',
      details: error.message
    });
  }
});

/**
 * Get device status
 * GET /api/wifi/devices/:id/status
 */
router.get('/devices/:id/status', auth, async (req, res) => {
  try {
    const device = await WiFiDevice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    // Get live status from device
    const liveStatus = await wifiScanner.getDeviceStatus(
      device.ipAddress,
      device.deviceMode
    );
    
    res.json({
      success: true,
      data: {
        device: {
          id: device._id,
          name: device.name,
          mode: device.deviceMode,
          status: device.status,
          isPaired: device.isPaired,
          lastSeen: device.lastSeen
        },
        liveStatus,
        currentState: device.currentState
      }
    });
  } catch (error) {
    console.error('Get device status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device status'
    });
  }
});

/**
 * Get device activity log
 * GET /api/wifi/devices/:id/activity
 */
router.get('/devices/:id/activity', auth, async (req, res) => {
  try {
    const device = await WiFiDevice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    const activityLog = device.activityLog
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50); // Return last 50 activities
    
    res.json({
      success: true,
      data: activityLog,
      count: activityLog.length
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity log'
    });
  }
});

// ==================== Statistics ====================

/**
 * Get WiFi devices statistics
 * GET /api/wifi/stats
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const allDevices = await WiFiDevice.findByUser(req.user.id);
    const onlineDevices = await WiFiDevice.findOnline(req.user.id);
    const esp32Devices = await WiFiDevice.findByMode(req.user.id, 'esp32');
    const standaloneDevices = await WiFiDevice.findByMode(req.user.id, 'standalone');
    
    // Calculate total power consumption
    let totalCurrentPower = 0;
    let totalDailyUsage = 0;
    let totalDailyCost = 0;
    let totalWeeklyUsage = 0;
    let totalWeeklyCost = 0;
    let totalMonthlyUsage = 0;
    let totalMonthlyCost = 0;
    
    allDevices.forEach(device => {
      totalCurrentPower += device.calculateCurrentPower();
      totalDailyUsage += device.todayUsage || 0;
      totalDailyCost += device.todayCost || 0;
      
      // Weekly calculation (last 7 days)
      const last7Days = device.powerTracking?.dailyUsage?.slice(-7) || [];
      last7Days.forEach(record => {
        totalWeeklyUsage += record.usage || 0;
        totalWeeklyCost += record.cost || 0;
      });
      
      // Monthly calculation (last 30 days)
      const last30Days = device.powerTracking?.dailyUsage?.slice(-30) || [];
      last30Days.forEach(record => {
        totalMonthlyUsage += record.usage || 0;
        totalMonthlyCost += record.cost || 0;
      });
    });
    
    res.json({
      success: true,
      data: {
        total: allDevices.length,
        online: onlineDevices.length,
        offline: allDevices.length - onlineDevices.length,
        esp32: esp32Devices.length,
        standalone: standaloneDevices.length,
        paired: allDevices.filter(d => d.isPaired).length,
        power: {
          currentPower: totalCurrentPower, // Watts
          dailyUsage: totalDailyUsage, // kWh
          dailyCost: totalDailyCost,
          weeklyUsage: totalWeeklyUsage, // kWh
          weeklyCost: totalWeeklyCost,
          monthlyUsage: totalMonthlyUsage, // kWh
          monthlyCost: totalMonthlyCost
        }
      }
    });
  } catch (error) {
    console.error('Get WiFi stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics'
    });
  }
});

/**
 * Get power usage statistics for a specific period
 * GET /api/wifi/usage/:period (daily, weekly, monthly)
 */
router.get('/usage/:period', auth, async (req, res) => {
  try {
    const { period } = req.params;
    const allDevices = await WiFiDevice.findByUser(req.user.id);
    
    let usageData = [];
    
    if (period === 'daily') {
      // Get last 30 days
      const daysMap = new Map();
      
      allDevices.forEach(device => {
        device.powerTracking?.dailyUsage?.slice(-30).forEach(record => {
          const dateKey = new Date(record.date).toISOString().split('T')[0];
          const existing = daysMap.get(dateKey) || { date: dateKey, usage: 0, cost: 0, devices: [] };
          existing.usage += record.usage || 0;
          existing.cost += record.cost || 0;
          existing.devices.push(device.name);
          daysMap.set(dateKey, existing);
        });
      });
      
      usageData = Array.from(daysMap.values()).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
    } else if (period === 'weekly') {
      // Get last 12 weeks
      const weeksMap = new Map();
      
      allDevices.forEach(device => {
        device.powerTracking?.weeklyUsage?.slice(-12).forEach(record => {
          const weekKey = new Date(record.weekStart).toISOString().split('T')[0];
          const existing = weeksMap.get(weekKey) || { weekStart: weekKey, usage: 0, cost: 0 };
          existing.usage += record.usage || 0;
          existing.cost += record.cost || 0;
          weeksMap.set(weekKey, existing);
        });
      });
      
      usageData = Array.from(weeksMap.values()).sort((a, b) => 
        new Date(a.weekStart) - new Date(b.weekStart)
      );
    } else if (period === 'monthly') {
      // Get last 12 months
      const monthsMap = new Map();
      
      allDevices.forEach(device => {
        device.powerTracking?.monthlyUsage?.slice(-12).forEach(record => {
          const existing = monthsMap.get(record.month) || { month: record.month, usage: 0, cost: 0 };
          existing.usage += record.usage || 0;
          existing.cost += record.cost || 0;
          monthsMap.set(record.month, existing);
        });
      });
      
      usageData = Array.from(monthsMap.values()).sort((a, b) => 
        a.month.localeCompare(b.month)
      );
    }
    
    res.json({
      success: true,
      data: usageData,
      period,
      count: usageData.length
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage statistics'
    });
  }
});

/**
 * Add power usage record to device
 * POST /api/wifi/devices/:id/usage
 */
router.post('/devices/:id/usage', auth, async (req, res) => {
  try {
    const { usageKwh } = req.body;
    
    const device = await WiFiDevice.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }
    
    await device.addPowerUsage(usageKwh);
    
    res.json({
      success: true,
      data: {
        todayUsage: device.todayUsage,
        todayCost: device.todayCost,
        totalUsage: device.powerTracking.totalUsage,
        totalCost: device.powerTracking.totalCost
      },
      message: 'Usage record added successfully'
    });
  } catch (error) {
    console.error('Add usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add usage record'
    });
  }
});

// @route   PATCH /api/wifi/devices/:id/status
// @desc    Update device connection status
// @access  Private
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const device = await WiFiDevice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: status },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update device status'
    });
  }
});

// @route   POST /api/wifi/devices/:id/disconnect
// @desc    Disconnect device and stop data receiving
// @access  Private
router.post('/:id/disconnect', auth, async (req, res) => {
  try {
    const device = await WiFiDevice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { 
        status: 'disconnected',
        isActive: false,
        lastSeen: new Date()
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    res.json({
      success: true,
      message: 'Device disconnected and data receiving stopped',
      data: device
    });
  } catch (error) {
    console.error('Error disconnecting device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect device'
    });
  }
});

module.exports = router;
