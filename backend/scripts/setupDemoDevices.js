const mongoose = require('mongoose');
const Device = require('../models/Device');
const User = require('../models/User');

// Demo devices with realistic power ratings
const demoDevices = [
  { name: 'Living Room Light', powerRating: 60, type: 'light', location: 'Living Room' },
  { name: 'Kitchen Light', powerRating: 40, type: 'light', location: 'Kitchen' },
  { name: 'Bedroom Fan', powerRating: 75, type: 'fan', location: 'Bedroom' },
  { name: 'Air Conditioner', powerRating: 1500, type: 'ac', location: 'Living Room' },
  { name: 'Smart TV', powerRating: 120, type: 'tv', location: 'Living Room' },
  { name: 'Refrigerator', powerRating: 150, type: 'appliance', location: 'Kitchen' },
  { name: 'Washing Machine', powerRating: 500, type: 'appliance', location: 'Utility' },
  { name: 'Ceiling Fan', powerRating: 70, type: 'fan', location: 'Bedroom' },
];

async function setupDemoDevices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iot-manager', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all active users
    const users = await User.find({ isActive: true });
    console.log(`📊 Found ${users.length} active users`);

    if (users.length === 0) {
      console.log('⚠️  No active users found. Please create a user first.');
      process.exit(0);
    }

    let totalCreated = 0;

    // Create demo devices for each user
    for (const user of users) {
      console.log(`\n👤 Setting up devices for: ${user.email}`);

      // Check if user already has devices
      const existingDevices = await Device.find({ userId: user._id });
      
      if (existingDevices.length > 0) {
        console.log(`   ℹ️  User already has ${existingDevices.length} devices`);
        
        // Turn all devices online
        await Device.updateMany(
          { userId: user._id },
          { $set: { status: 'online' } }
        );
        console.log(`   ✅ Turned ${existingDevices.length} devices ONLINE`);
        continue;
      }

      // Create demo devices
      const devicesToCreate = demoDevices.map(device => ({
        ...device,
        userId: user._id,
        status: 'online', // Start as online
        description: `Demo ${device.type} device`,
        isActive: true
      }));

      const created = await Device.insertMany(devicesToCreate);
      totalCreated += created.length;
      console.log(`   ✅ Created ${created.length} demo devices (all ONLINE)`);
    }

    console.log(`\n🎉 Setup complete! Created ${totalCreated} devices total.`);
    console.log('💡 All devices are ONLINE and ready for simulation.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDemoDevices();
}

module.exports = setupDemoDevices;
