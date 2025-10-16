require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// Demo user credentials
const DEMO_USER = {
  email: 'dummy@gmail.com',
  password: 'dummy123',
  name: 'Demo User',
  role: 'admin'
};

async function createDemoUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iot-manager', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: DEMO_USER.email });
    
    if (existingUser) {
      console.log('⚠️  Demo user already exists!');
      console.log(`📧 Email: ${DEMO_USER.email}`);
      console.log(`🔑 Password: ${DEMO_USER.password}`);
      process.exit(0);
    }

    // Create demo user
    const user = new User(DEMO_USER);
    await user.save();

    console.log('✅ Demo user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', DEMO_USER.email);
    console.log('🔑 Password:', DEMO_USER.password);
    console.log('👤 Name:', DEMO_USER.name);
    console.log('🔐 Role:', DEMO_USER.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    process.exit(1);
  }
}

createDemoUser();
