const express = require('express');
const { WiFiEnergyDevice, WiFiEnergyAnalytics } = require('../models/WiFiEnergyModels');
const { ESP32 } = require('../models/WiFiModels');
const Device = require('../models/Device');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize/Sync WiFi Energy Devices from existing ESP32 and devices
router.post('/sync', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all ESP32 controllers for user
    const esp32Controllers = await ESP32.find({ userId, isApproved: true });
    
    if (esp32Controllers.length === 0) {
      return res.json({
        success: true,
        message: 'No ESP32 controllers found to sync',
        data: []
      });
    }
    
    const syncedDevices = [];
    
    for (const esp32 of esp32Controllers) {
      // Get all devices connected to this ESP32
      const connectedDevices = await Device.find({ 
        userId, 
        esp32Id: esp32._id,
        isActive: true 
      });
      
      if (connectedDevices.length === 0) continue;
      
      // Check if WiFiEnergyDevice already exists
      let wifiEnergyDevice = await WiFiEnergyDevice.findOne({ 
        userId, 
        esp32Id: esp32._id 
      });
      
      if (!wifiEnergyDevice) {
        // Create new WiFiEnergyDevice
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
      
      // Update connected devices
      wifiEnergyDevice.connectedDevices = connectedDevices.map(device => ({
        deviceId: device._id,
        deviceName: device.name,
        deviceType: device.type,
        powerRating: device.powerRating,
        connectionStatus: 'connected',
        deviceMAC: device.macAddress,
        deviceIP: device.ipAddress,
        connectedAt: new Date(),
        lastActivity: new Date(),
        isActive: true
      }));
      
      await wifiEnergyDevice.save();
      syncedDevices.push(wifiEnergyDevice);
    }
    
    res.json({
      success: true,
      message: `Synced ${syncedDevices.length} ESP32 controllers with devices`,
      data: syncedDevices
    });
    
  } catch (error) {
    console.error('Error syncing WiFi energy devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync WiFi energy devices'
    });
  }
});

// Get all WiFi Energy Devices for user
router.get('/devices', auth, async (req, res) => {
  try {
    const wifiEnergyDevices = await WiFiEnergyDevice.find({ userId: req.user.id })
      .populate('esp32Id')
      .populate('connectedDevices.deviceId')
      .sort({ lastUpdated: -1 });
    
    res.json({
      success: true,
      data: wifiEnergyDevices,
      count: wifiEnergyDevices.length
    });
  } catch (error) {
    console.error('Error fetching WiFi energy devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WiFi energy devices'
    });
  }
});

// Get WiFi Energy Analytics for user
router.get('/analytics', auth, async (req, res) => {
  try {
    const { startDate, endDate, esp32Id, deviceId } = req.query;
    
    let query = { userId: req.user.id, connectionStatus: 'connected' };
    
    if (esp32Id) query.esp32Id = esp32Id;
    if (deviceId) query.deviceId = deviceId;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const analytics = await WiFiEnergyAnalytics.find(query)
      .sort({ timestamp: -1 })
      .limit(1000) // Limit to recent 1000 records
      .populate('deviceId', 'name type powerRating status')
      .populate('esp32Id', 'name location ipAddress');
    
    // Calculate summary statistics
    const summary = {
      totalRecords: analytics.length,
      totalEnergyConsumed: analytics.reduce((sum, a) => sum + a.energyConsumed, 0),
      totalCost: analytics.reduce((sum, a) => sum + a.costPerHour, 0),
      averagePower: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + a.currentPower, 0) / analytics.length 
        : 0,
      currency: analytics[0]?.currencySymbol || '$',
      uniqueDevices: [...new Set(analytics.map(a => a.deviceId?.toString()))].length,
      uniqueESP32s: [...new Set(analytics.map(a => a.esp32Id?.toString()))].length
    };
    
    res.json({
      success: true,
      data: analytics,
      summary
    });
  } catch (error) {
    console.error('Error fetching WiFi energy analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch WiFi energy analytics'
    });
  }
});

// Get analytics by ESP32
router.get('/analytics/esp32/:esp32Id', auth, async (req, res) => {
  try {
    const { esp32Id } = req.params;
    const { startDate, endDate } = req.query;
    
    const analytics = await WiFiEnergyAnalytics.getESP32Analytics(
      esp32Id,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    // Calculate totals for this ESP32
    const summary = {
      totalDevices: [...new Set(analytics.map(a => a.deviceId?.toString()))].length,
      totalPower: analytics.reduce((sum, a) => sum + a.currentPower, 0),
      totalDailyCost: analytics.reduce((sum, a) => sum + a.costPerDay, 0),
      totalMonthlyCost: analytics.reduce((sum, a) => sum + a.costPerMonth, 0),
      currency: analytics[0]?.currencySymbol || '$'
    };
    
    res.json({
      success: true,
      data: analytics,
      summary
    });
  } catch (error) {
    console.error('Error fetching ESP32 analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ESP32 analytics'
    });
  }
});

// Get latest analytics for all connected devices
router.get('/analytics/latest', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all WiFi energy devices for user
    const wifiDevices = await WiFiEnergyDevice.find({ userId });
    
    // Get latest analytics for each device
    const latestAnalytics = [];
    
    for (const wifiDevice of wifiDevices) {
      for (const connectedDevice of wifiDevice.connectedDevices) {
        if (connectedDevice.connectionStatus === 'connected' && connectedDevice.isActive) {
          const latest = await WiFiEnergyAnalytics.findOne({
            userId,
            deviceId: connectedDevice.deviceId,
            connectionStatus: 'connected'
          }).sort({ timestamp: -1 });
          
          if (latest) {
            latestAnalytics.push({
              ...latest.toObject(),
              esp32Name: wifiDevice.esp32Name,
              esp32Location: wifiDevice.esp32Location,
              deviceName: connectedDevice.deviceName,
              deviceType: connectedDevice.deviceType
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: latestAnalytics,
      count: latestAnalytics.length
    });
  } catch (error) {
    console.error('Error fetching latest analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest analytics'
    });
  }
});

// Get summary statistics
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all WiFi energy devices
    const wifiDevices = await WiFiEnergyDevice.find({ userId });
    
    // Get latest analytics
    const latestAnalytics = await WiFiEnergyAnalytics.find({
      userId,
      connectionStatus: 'connected',
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });
    
    const summary = {
      totalESP32Controllers: wifiDevices.length,
      totalConnectedDevices: wifiDevices.reduce((sum, w) => sum + w.totalConnectedDevices, 0),
      totalPowerRating: wifiDevices.reduce((sum, w) => sum + w.totalPowerRating, 0),
      currentTotalPower: latestAnalytics.reduce((sum, a) => sum + a.currentPower, 0),
      totalHourlyCost: latestAnalytics.reduce((sum, a) => sum + a.costPerHour, 0),
      totalDailyCost: latestAnalytics.reduce((sum, a) => sum + a.costPerDay, 0),
      totalMonthlyCost: latestAnalytics.reduce((sum, a) => sum + a.costPerMonth, 0),
      totalYearlyCost: latestAnalytics.reduce((sum, a) => sum + a.costPerYear, 0),
      currency: latestAnalytics[0]?.currencySymbol || '$',
      lastUpdated: new Date()
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching WiFi energy summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary'
    });
  }
});

module.exports = router;
