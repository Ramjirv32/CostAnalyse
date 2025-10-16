const EnergyEstimate = require('../models/EnergyEstimate');
const Device = require('../models/Device');
const User = require('../models/User');

class EnergySimulator {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  // Generate realistic power consumption with daily patterns
  generateRealisticPower(baseWattage, hour) {
    // Peak hours: 6-9 AM and 6-11 PM (higher usage)
    // Low hours: 12-5 AM (lower usage)
    let multiplier = 1.0;
    
    if (hour >= 6 && hour <= 9) {
      multiplier = 1.3; // Morning peak
    } else if (hour >= 18 && hour <= 23) {
      multiplier = 1.4; // Evening peak
    } else if (hour >= 0 && hour <= 5) {
      multiplier = 0.6; // Night low
    } else {
      multiplier = 0.9; // Day normal
    }

    // Add random variation (±10%)
    const variation = (Math.random() - 0.5) * 0.2;
    const power = baseWattage * multiplier * (1 + variation);
    
    return Math.max(0, power);
  }

  // Start the simulation
  async start(intervalSeconds = 10) {
    if (this.isRunning) {
      console.log('⚠️  Energy simulator already running');
      return;
    }

    this.isRunning = true;
    console.log(`🔋 Starting energy simulator (every ${intervalSeconds}s)`);

    // Run immediately
    await this.simulateEnergyData();

    // Then run periodically
    this.interval = setInterval(async () => {
      await this.simulateEnergyData();
    }, intervalSeconds * 1000);
  }

  // Stop the simulation
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Energy simulator stopped');
  }

  // Main simulation function
  async simulateEnergyData() {
    try {
      // Get all users
      const users = await User.find({ isActive: true });
      
      if (users.length === 0) {
        console.log('⚠️  No active users found for simulation');
        return;
      }

      const currentHour = new Date().getHours();
      let totalEstimates = 0;

      // For each user
      for (const user of users) {
        // Get user's devices
        const devices = await Device.find({ 
          userId: user._id, 
          isActive: true 
        });

        if (devices.length === 0) continue;

        const estimates = [];

        // Generate data for each device
        for (const device of devices) {
          // Only simulate for online devices
          if (device.status === 'online') {
            const currentPower = this.generateRealisticPower(
              device.powerRating, 
              currentHour
            );

            // Calculate electrical parameters
            const voltage = 220 + (Math.random() - 0.5) * 10; // 215-225V
            const current = currentPower / voltage; // Amperes
            const frequency = 50 + (Math.random() - 0.5) * 0.2; // 49.9-50.1Hz

            // Calculate costs
            const costPerKwh = 0.20;
            const costPerSecond = (currentPower / 1000) * costPerKwh / 3600;
            const costPerHour = (currentPower / 1000) * costPerKwh;
            const costPerDay = costPerHour * 24;
            const dailyUsage = (currentPower / 1000) * 24; // kWh
            const monthlyUsage = dailyUsage * 30;
            const monthlyCost = costPerDay * 30;

            estimates.push({
              userId: user._id,
              deviceId: device._id,
              deviceName: device.name,
              deviceType: 'regular',
              currentPower: currentPower,
              powerRating: device.powerRating,
              voltage: voltage,
              current: current,
              frequency: frequency,
              costPerKwh: costPerKwh,
              instantCost: costPerSecond,
              costPerSecond: costPerSecond,
              costPerHour: costPerHour,
              costPerDay: costPerDay,
              hourlyUsage: currentPower / 1000,
              hourlyCost: costPerHour,
              dailyUsage: dailyUsage,
              dailyCost: costPerDay,
              monthlyUsage: monthlyUsage,
              monthlyCost: monthlyCost,
              status: 'online',
              location: device.location || 'Unknown'
            });
          }
        }

        // Save all estimates for this user
        if (estimates.length > 0) {
          await EnergyEstimate.insertMany(estimates);
          totalEstimates += estimates.length;
        }
      }

      console.log(`✅ Generated ${totalEstimates} energy estimates for ${users.length} users`);
    } catch (error) {
      console.error('❌ Error in energy simulation:', error);
    }
  }

  // Generate historical data for charts (one-time setup)
  async generateHistoricalData(days = 7) {
    try {
      console.log(`📊 Generating ${days} days of historical data...`);
      
      const users = await User.find({ isActive: true });
      let totalGenerated = 0;

      for (const user of users) {
        const devices = await Device.find({ 
          userId: user._id, 
          isActive: true,
          status: 'online'
        });

        if (devices.length === 0) continue;

        // Generate data for past days
        for (let day = days; day >= 0; day--) {
          const date = new Date();
          date.setDate(date.getDate() - day);

          // Generate data for each hour of the day
          for (let hour = 0; hour < 24; hour++) {
            date.setHours(hour, 0, 0, 0);

            const estimates = devices.map(device => ({
              userId: user._id,
              deviceId: device._id,
              deviceName: device.name,
              deviceType: 'regular',
              currentPower: this.generateRealisticPower(device.powerRating, hour),
              status: 'online',
              timestamp: new Date(date),
              location: device.location || 'Unknown'
            }));

            await EnergyEstimate.insertMany(estimates);
            totalGenerated += estimates.length;
          }
        }
      }

      console.log(`✅ Generated ${totalGenerated} historical estimates`);
      return totalGenerated;
    } catch (error) {
      console.error('❌ Error generating historical data:', error);
      throw error;
    }
  }

  // Get aggregated data for charts
  async getChartData(userId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const estimates = await EnergyEstimate.aggregate([
        {
          $match: {
            userId: userId,
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
            },
            totalUsage: { 
              $sum: { $divide: ["$currentPower", 1000] } // Convert to kWh
            },
            totalCost: { 
              $sum: "$instantCost" 
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      return estimates.map(est => ({
        date: est._id,
        usage: (est.totalUsage / est.count).toFixed(2),
        cost: (est.totalCost * 3600).toFixed(2) // Convert to hourly cost
      }));
    } catch (error) {
      console.error('Error getting chart data:', error);
      return [];
    }
  }
}

// Create singleton instance
const energySimulator = new EnergySimulator();

module.exports = energySimulator;
