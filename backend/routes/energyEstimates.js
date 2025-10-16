const express = require('express');
const router = express.Router();
const EnergyEstimate = require('../models/EnergyEstimate');
const Device = require('../models/Device');
const WiFiDevice = require('../models/WiFiDevice');
const { auth } = require('../middleware/auth');
const energySimulator = require('../services/energySimulator');

// @route   POST /api/energy/estimate
// @desc    Record a new energy estimate
// @access  Private
router.post('/estimate', auth, async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType, currentPower, location, status } = req.body;

    if (!deviceId || !deviceName || currentPower === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Device ID, name, and current power are required'
      });
    }

    const estimate = new EnergyEstimate({
      userId: req.user.id,
      deviceId,
      deviceName,
      deviceType: deviceType || 'regular',
      currentPower,
      location,
      status: status || 'online'
    });

    await estimate.save();

    res.status(201).json({
      success: true,
      data: estimate
    });
  } catch (error) {
    console.error('Error creating energy estimate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create energy estimate'
    });
  }
});

// @route   POST /api/energy/estimate/bulk
// @desc    Record multiple energy estimates at once
// @access  Private
router.post('/estimate/bulk', auth, async (req, res) => {
  try {
    const { estimates } = req.body;

    if (!Array.isArray(estimates) || estimates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Estimates array is required'
      });
    }

    // Add userId to each estimate
    const estimatesWithUser = estimates.map(est => ({
      ...est,
      userId: req.user.id
    }));

    const savedEstimates = await EnergyEstimate.insertMany(estimatesWithUser);

    res.status(201).json({
      success: true,
      data: savedEstimates,
      count: savedEstimates.length
    });
  } catch (error) {
    console.error('Error creating bulk energy estimates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create energy estimates'
    });
  }
});

// @route   GET /api/energy/latest
// @desc    Get latest energy estimates for user
// @access  Private
router.get('/latest', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const estimates = await EnergyEstimate.getLatestByUser(req.user.id, limit);

    res.json({
      success: true,
      data: estimates,
      count: estimates.length
    });
  } catch (error) {
    console.error('Error fetching latest estimates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch energy estimates'
    });
  }
});

// @route   GET /api/energy/device/:deviceId
// @desc    Get energy history for a specific device
// @access  Private
router.get('/device/:deviceId', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const hours = parseInt(req.query.hours) || 24;

    const history = await EnergyEstimate.getDeviceHistory(req.user.id, deviceId, hours);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching device history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch device history'
    });
  }
});

// @route   GET /api/energy/stats
// @desc    Get aggregated energy statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const period = req.query.period || 'day'; // hour, day, week, month

    const stats = await EnergyEstimate.getAggregatedStats(req.user.id, period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching energy stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch energy statistics'
    });
  }
});

// @route   GET /api/energy/realtime
// @desc    Get real-time energy data for all user devices (from stored estimates)
// @access  Private
router.get('/realtime', auth, async (req, res) => {
  try {
    // Get latest estimate for each device using aggregation
    const latestEstimates = await EnergyEstimate.aggregate([
      {
        $match: {
          userId: req.user.id,
          status: 'online'
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$deviceId',
          latestEstimate: { $first: '$$ROOT' }
        }
      }
    ]);

    const deviceData = latestEstimates.map(item => item.latestEstimate);

    const wifiDeviceCount = await WiFiDevice.countDocuments({ 
      userId: req.user.id, 
      isActive: true 
    });

    const totalDevices = deviceData.length + wifiDeviceCount;
    const totalPower = deviceData.reduce((sum, d) => sum + (d.currentPower || 0), 0);
    const totalCostPerSecond = deviceData.reduce((sum, d) => sum + (d.costPerSecond || 0), 0);
    const totalCostPerHour = deviceData.reduce((sum, d) => sum + (d.costPerHour || 0), 0);
    const totalCostPerDay = deviceData.reduce((sum, d) => sum + (d.costPerDay || 0), 0);

    res.json({
      success: true,
      data: {
        devices: deviceData,
        wifiDeviceCount: wifiDeviceCount,
        totalDevices: totalDevices,
        totalPower: totalPower.toFixed(2),
        totalCostPerSecond: totalCostPerSecond.toFixed(8),
        totalCostPerHour: totalCostPerHour.toFixed(4),
        totalCostPerDay: totalCostPerDay.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch realtime energy data'
    });
  }
});

// @route   GET /api/energy/summary
// @desc    Get comprehensive energy summary for dashboard
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const [hourlyStats, dailyStats, weeklyStats, monthlyStats] = await Promise.all([
      EnergyEstimate.getAggregatedStats(req.user.id, 'hour'),
      EnergyEstimate.getAggregatedStats(req.user.id, 'day'),
      EnergyEstimate.getAggregatedStats(req.user.id, 'week'),
      EnergyEstimate.getAggregatedStats(req.user.id, 'month')
    ]);

    res.json({
      success: true,
      data: {
        hourly: hourlyStats,
        daily: dailyStats,
        weekly: weeklyStats,
        monthly: monthlyStats
      }
    });
  } catch (error) {
    console.error('Error fetching energy summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch energy summary'
    });
  }
});

// @route   DELETE /api/energy/cleanup
// @desc    Cleanup old energy estimates (admin only)
// @access  Private
router.delete('/cleanup', auth, async (req, res) => {
  try {
    const daysToKeep = parseInt(req.query.days) || 30;
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await EnergyEstimate.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old energy estimates`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up estimates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup energy estimates'
    });
  }
});

// @route   GET /api/energy/charts
// @desc    Get chart data for dashboard
// @access  Private
router.get('/charts', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const chartData = await energySimulator.getChartData(req.user.id, days);

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data'
    });
  }
});

// @route   POST /api/energy/simulator/start
// @desc    Start energy simulator
// @access  Private
router.post('/simulator/start', auth, async (req, res) => {
  try {
    const intervalSeconds = parseInt(req.body.interval) || 10;
    await energySimulator.start(intervalSeconds);

    res.json({
      success: true,
      message: 'Energy simulator started'
    });
  } catch (error) {
    console.error('Error starting simulator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start simulator'
    });
  }
});

// @route   POST /api/energy/simulator/stop
// @desc    Stop energy simulator
// @access  Private
router.post('/simulator/stop', auth, async (req, res) => {
  try {
    energySimulator.stop();

    res.json({
      success: true,
      message: 'Energy simulator stopped'
    });
  } catch (error) {
    console.error('Error stopping simulator:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop simulator'
    });
  }
});

// @route   POST /api/energy/simulator/generate-history
// @desc    Generate historical data for charts
// @access  Private
router.post('/simulator/generate-history', auth, async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 7;
    const count = await energySimulator.generateHistoricalData(days);

    res.json({
      success: true,
      message: `Generated ${count} historical estimates`,
      count
    });
  } catch (error) {
    console.error('Error generating history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate historical data'
    });
  }
});

module.exports = router;
