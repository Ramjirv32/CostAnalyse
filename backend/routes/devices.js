const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { auth } = require('../middleware/auth');

// Demo devices template
const demoDevices = [
  { name: 'Living Room Light', powerRating: 60, type: 'light', location: 'Living Room' },
  { name: 'Kitchen Light', powerRating: 40, type: 'light', location: 'Kitchen' },
  { name: 'Bedroom Fan', powerRating: 75, type: 'fan', location: 'Bedroom' },
  { name: 'Air Conditioner', powerRating: 1500, type: 'ac', location: 'Living Room' },
  { name: 'Smart TV', powerRating: 120, type: 'tv', location: 'Living Room' },
  { name: 'Refrigerator', powerRating: 150, type: 'appliance', location: 'Kitchen' },
];

// Get all devices for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const devices = await Device.findByUser(req.user.id)
      .populate('userId', 'name email')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch devices'
    });
  }
});

// Get single device by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    }).populate('userId', 'name email');

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
    console.error('Error fetching device:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch device'
    });
  }
});

// Create new device
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, type, category, powerRating, location, tags } = req.body;

    // Validate required fields
    if (!name || !powerRating) {
      return res.status(400).json({
        success: false,
        error: 'Device name and power rating are required'
      });
    }

    // Check if device name already exists for this user
    const existingDevice = await Device.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      userId: req.user.id,
      isActive: true
    });

    if (existingDevice) {
      return res.status(409).json({
        success: false,
        error: 'A device with this name already exists'
      });
    }

    // Create new device
    const device = new Device({
      name,
      description,
      type: type || 'other',
      category,
      powerRating,
      location,
      tags: tags || [],
      userId: req.user.id
    });

    const savedDevice = await device.save();

    res.status(201).json({
      success: true,
      data: savedDevice,
      message: 'Device created successfully'
    });
  } catch (error) {
    console.error('Error creating device:', error);

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
      error: 'Failed to create device'
    });
  }
});

// Update device
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, type, category, powerRating, location, tags, status } = req.body;

    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Update fields
    if (name !== undefined) device.name = name;
    if (description !== undefined) device.description = description;
    if (type !== undefined) device.type = type;
    if (category !== undefined) device.category = category;
    if (powerRating !== undefined) device.powerRating = powerRating;
    if (location !== undefined) device.location = location;
    if (tags !== undefined) device.tags = tags;
    if (status !== undefined) {
      device.status = status;
      device.lastSeen = new Date();
    }

    const updatedDevice = await device.save();

    res.json({
      success: true,
      data: updatedDevice,
      message: 'Device updated successfully'
    });
  } catch (error) {
    console.error('Error updating device:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update device'
    });
  }
});

// Toggle device status (on/off)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Toggle status between online and offline
    const newStatus = device.status === 'online' ? 'offline' : 'online';
    device.status = newStatus;
    device.lastSeen = new Date();

    const updatedDevice = await device.save();

    res.json({
      success: true,
      data: updatedDevice,
      message: `Device ${newStatus === 'online' ? 'turned on' : 'turned off'}`
    });
  } catch (error) {
    console.error('Error toggling device:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to toggle device'
    });
  }
});

// Add usage record to device
router.post('/:id/usage', auth, async (req, res) => {
  try {
    const { usage, cost } = req.body;

    if (usage === undefined || cost === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Usage and cost are required'
      });
    }

    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    await device.addUsageRecord(usage, cost);

    res.json({
      success: true,
      message: 'Usage record added successfully',
      data: {
        usage: device.todayUsage,
        cost: device.todayCost,
        totalUsage: device.totalUsage,
        totalCost: device.totalCost
      }
    });
  } catch (error) {
    console.error('Error adding usage record:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add usage record'
    });
  }
});

// Delete device (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Soft delete by setting isActive to false
    device.isActive = false;
    await device.save();

    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete device'
    });
  }
});

// Get device statistics for dashboard
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id,
      isActive: true
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Calculate stats
    const totalUsage = device.totalUsage;
    const totalCost = device.totalCost;
    const averageDailyUsage = device.dailyUsage.length > 0
      ? totalUsage / device.dailyUsage.length
      : 0;
    const averageDailyCost = device.dailyUsage.length > 0
      ? totalCost / device.dailyUsage.length
      : 0;

    // Get last 7 days usage
    const last7Days = device.dailyUsage
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7)
      .reverse();

    res.json({
      success: true,
      data: {
        totalUsage,
        totalCost,
        averageDailyUsage,
        averageDailyCost,
        last7Days,
        todayUsage: device.todayUsage,
        todayCost: device.todayCost,
        status: device.status,
        lastSeen: device.lastSeen
      }
    });
  } catch (error) {
    console.error('Error fetching device stats:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid device ID'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch device statistics'
    });
  }
});

// Auto-create demo devices for user
router.post('/setup-demo', auth, async (req, res) => {
  try {
    // Check if user already has devices
    const existingDevices = await Device.find({ userId: req.user.id, isActive: true });
    
    if (existingDevices.length > 0) {
      // Turn all existing devices online
      await Device.updateMany(
        { userId: req.user.id, isActive: true },
        { $set: { status: 'online' } }
      );
      
      return res.json({
        success: true,
        message: `Turned ${existingDevices.length} existing devices online`,
        data: existingDevices,
        created: false
      });
    }

    // Create demo devices
    const devicesToCreate = demoDevices.map(device => ({
      ...device,
      userId: req.user.id,
      status: 'online', // Start as online
      description: `Demo ${device.type} device`,
      isActive: true
    }));

    const created = await Device.insertMany(devicesToCreate);

    res.json({
      success: true,
      message: `Created ${created.length} demo devices`,
      data: created,
      created: true
    });
  } catch (error) {
    console.error('Error setting up demo devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup demo devices'
    });
  }
});

module.exports = router;
