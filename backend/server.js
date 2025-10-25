require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const deviceRoutes = require('./routes/devices');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const wifiDeviceRoutes = require('./routes/wifiDevices');
const wifiManagementRoutes = require('./routes/wifi');
const wifiEnergyRoutes = require('./routes/wifiEnergy');
const currencyRoutes = require('./routes/currency');
const energyEstimateRoutes = require('./routes/energyEstimates');
const preferencesRoutes = require('./routes/preferences');
const energySimulator = require('./services/energySimulator');
const wifiEnergyCalculator = require('./services/wifiEnergyCalculator');
const emailService = require('./services/emailService');
const alertService = require('./services/alertService');
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware


// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],

}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iot-manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Initialize services after DB connection
  setTimeout(() => {
    // Start energy simulator
    energySimulator.start(10); // Generate data every 10 seconds
    
    // Start WiFi energy calculator
    wifiEnergyCalculator.start(10); // Calculate WiFi energy every 10 seconds
    
    // Initialize email service
    emailService.initialize();
    
    // Start alert service
    const checkInterval = parseInt(process.env.ALERT_CHECK_INTERVAL) || 30;
    alertService.start(checkInterval);
    
    // Start email test mode if enabled
    if (process.env.EMAIL_TEST_MODE === 'true') {
      console.log('🧪 Email test mode enabled');
      emailService.startTestMode(5); // Send test email every 5 seconds
    }
  }, 2000);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wifi', wifiManagementRoutes);
app.use('/api/wifi-management', wifiDeviceRoutes);
app.use('/api/wifi-energy', wifiEnergyRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/energy', energyEstimateRoutes);
app.use('/api/preferences', preferencesRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.message
    });
  }

  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return res.status(500).json({
      error: 'Database Error',
      details: 'Internal server error'
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 IoT Manager Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
