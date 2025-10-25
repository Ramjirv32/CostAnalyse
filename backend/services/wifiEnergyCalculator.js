const { WiFiEnergyDevice, WiFiEnergyAnalytics } = require('../models/WiFiEnergyModels');
const Device = require('../models/Device');
const User = require('../models/User');

class WiFiEnergyCalculator {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  // Start the WiFi energy calculator
  start(intervalSeconds = 10) {
    if (this.isRunning) {
      console.log('⚡ WiFi Energy Calculator already running');
      return;
    }

    console.log(`⚡ Starting WiFi Energy Calculator (every ${intervalSeconds}s)`);
    this.isRunning = true;

    // Run immediately
    this.calculateAll();

    // Then run at intervals
    this.interval = setInterval(() => {
      this.calculateAll();
    }, intervalSeconds * 1000);
  }

  // Stop the calculator
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('⚡ WiFi Energy Calculator stopped');
  }

  // Calculate energy for all WiFi-connected devices
  async calculateAll() {
    try {
      // Get all WiFi energy devices
      const wifiDevices = await WiFiEnergyDevice.find({})
        .populate('userId')
        .populate('esp32Id');

      if (wifiDevices.length === 0) {
        return;
      }

      let totalCalculations = 0;

      for (const wifiDevice of wifiDevices) {
        // Skip if ESP32 is offline
        if (wifiDevice.esp32Status !== 'online') {
          continue;
        }

        // Get user's currency preferences
        const user = wifiDevice.userId;
        let currencyPrefs = null;

        if (user) {
          // Fetch user's currency preferences
          try {
            const User = require('../models/User');
            const fullUser = await User.findById(user._id);
            currencyPrefs = fullUser?.currencyPreferences || null;
          } catch (err) {
            console.error('Error fetching user currency prefs:', err);
          }
        }

        // Calculate for each connected device
        for (const connectedDevice of wifiDevice.connectedDevices) {
          // Only calculate for connected and active devices
          if (connectedDevice.connectionStatus !== 'connected' || !connectedDevice.isActive) {
            continue;
          }

          try {
            // Generate simulated energy data
            const powerRating = connectedDevice.powerRating;
            const currentPower = this.simulateCurrentPower(powerRating);
            const voltage = this.simulateVoltage(220);
            const current = currentPower / voltage;
            const frequency = 50 + (Math.random() * 2 - 1); // 49-51 Hz

            // Create or update analytics record
            const analyticsData = {
              userId: wifiDevice.userId,
              esp32Id: wifiDevice.esp32Id,
              deviceId: connectedDevice.deviceId,
              wifiEnergyDeviceId: wifiDevice._id,
              deviceName: connectedDevice.deviceName,
              deviceType: connectedDevice.deviceType,
              esp32Name: wifiDevice.esp32Name,
              esp32Location: wifiDevice.esp32Location,
              timestamp: new Date(),
              powerRating,
              currentPower,
              voltage,
              current,
              frequency,
              connectionStatus: 'connected',
              isActive: true
            };

            // Create analytics record
            const analytics = new WiFiEnergyAnalytics(analyticsData);

            // Calculate costs based on user's currency preferences
            analytics.calculateCosts(currencyPrefs);

            // Save analytics
            await analytics.save();
            totalCalculations++;

          } catch (error) {
            console.error(`Error calculating for device ${connectedDevice.deviceId}:`, error);
          }
        }
      }

      if (totalCalculations > 0) {
        console.log(`✅ WiFi Energy: Generated ${totalCalculations} analytics records`);
      }

    } catch (error) {
      console.error('Error in WiFi energy calculator:', error);
    }
  }

  // Simulate current power consumption (with some randomness)
  simulateCurrentPower(powerRating) {
    // Add ±10% variation to simulate real usage
    const variation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    return Math.round(powerRating * variation * 100) / 100;
  }

  // Simulate voltage (220V ±5%)
  simulateVoltage(nominal = 220) {
    const variation = 0.95 + Math.random() * 0.1; // 0.95 to 1.05
    return Math.round(nominal * variation * 10) / 10;
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval ? 'Active' : 'Stopped'
    };
  }
}

// Create singleton instance
const wifiEnergyCalculator = new WiFiEnergyCalculator();

module.exports = wifiEnergyCalculator;
