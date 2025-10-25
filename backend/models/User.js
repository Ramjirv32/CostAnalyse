const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Currency and Unit Preferences
  currencyPreferences: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SEK']
    },
    currencySymbol: {
      type: String,
      default: '$'
    },
    country: {
      type: String,
      default: 'United States'
    },
    electricityRate: {
      type: Number,
      default: 0.12, // USD per kWh
      min: 0
    },
    conversionRate: {
      type: Number,
      default: 1.0, // Conversion rate from USD
      min: 0
    }
  },
  displayPreferences: {
    powerUnit: {
      type: String,
      default: 'watts',
      enum: ['watts', 'kilowatts']
    },
    energyUnit: {
      type: String,
      default: 'kWh',
      enum: ['kWh', 'Wh', 'MWh']
    },
    calculationMethod: {
      type: String,
      default: 'electricity',
      enum: ['electricity', 'carbon']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Virtual for device count
userSchema.virtual('deviceCount', {
  ref: 'Device',
  localField: '_id',
  foreignField: 'userId',
  count: true
});

module.exports = mongoose.model('User', userSchema);
