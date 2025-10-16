const Device = require('../models/Device');
const User = require('../models/User');
const emailService = require('./emailService');

class AlertService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.inactiveThresholdHours = 24; // Alert if device inactive for 24 hours
    this.alertedDevices = new Set(); // Track already alerted devices
  }

  // Start monitoring for inactive devices
  start(checkIntervalMinutes = 30) {
    if (this.isRunning) {
      console.log('⚠️  Alert service already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔔 Starting alert service (checking every ${checkIntervalMinutes} minutes)`);

    // Run immediately
    this.checkInactiveDevices();

    // Then run periodically
    this.interval = setInterval(() => {
      this.checkInactiveDevices();
    }, checkIntervalMinutes * 60 * 1000);
  }

  // Stop monitoring
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    this.alertedDevices.clear();
    console.log('🛑 Alert service stopped');
  }

  // Check for inactive devices
  async checkInactiveDevices() {
    try {
      const thresholdDate = new Date();
      thresholdDate.setHours(thresholdDate.getHours() - this.inactiveThresholdHours);

      // Find devices that were online but haven't been updated recently
      const inactiveDevices = await Device.find({
        isActive: true,
        status: 'offline',
        updatedAt: { $lt: thresholdDate }
      }).populate('userId', 'name email');

      console.log(`🔍 Found ${inactiveDevices.length} inactive devices`);

      for (const device of inactiveDevices) {
        const deviceKey = `${device._id}_${device.userId._id}`;
        
        // Skip if already alerted
        if (this.alertedDevices.has(deviceKey)) {
          continue;
        }

        // Send alert
        await this.sendInactiveAlert(device);
        
        // Mark as alerted
        this.alertedDevices.add(deviceKey);
      }
    } catch (error) {
      console.error('❌ Error checking inactive devices:', error);
    }
  }

  // Send inactive device alert
  async sendInactiveAlert(device) {
    try {
      const user = device.userId;
      const hoursInactive = Math.floor(
        (new Date() - device.updatedAt) / (1000 * 60 * 60)
      );

      const subject = `⚠️ Device Inactive: ${device.name}`;
      const message = `Your device "${device.name}" has been inactive for ${hoursInactive} hours. Please check if the device is powered on and connected.`;

      // Send email
      const emailSent = await emailService.sendAlert(
        user.email,
        subject,
        message,
        device.name
      );

      if (emailSent) {
        console.log(`✅ Inactive alert sent for device: ${device.name} to ${user.email}`);
      }

      return emailSent;
    } catch (error) {
      console.error('❌ Error sending inactive alert:', error);
      return false;
    }
  }

  // Get alert statistics
  getStats() {
    return {
      isRunning: this.isRunning,
      alertedDevicesCount: this.alertedDevices.size,
      inactiveThresholdHours: this.inactiveThresholdHours
    };
  }

  // Reset alerted devices (for testing)
  resetAlerts() {
    this.alertedDevices.clear();
    console.log('🔄 Alert tracking reset');
  }
}

// Create singleton instance
const alertService = new AlertService();

module.exports = alertService;
