const mongoose = require('mongoose');

const userMoneySelectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  currency: {
    type: String,
    enum: ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'],
    default: 'USD'
  },
  currencySymbol: {
    type: String,
    default: '$'
  },
  country: {
    type: String,
    enum: ['US', 'IN', 'EU', 'UK', 'JP', 'AU', 'CA'],
    default: 'US'
  },
  electricityRate: {
    type: Number, // Cost per kWh in selected currency
    required: [true, 'Electricity rate is required'],
    min: [0.01, 'Electricity rate must be at least 0.01'],
    max: [100, 'Electricity rate cannot exceed 100 per kWh']
  },
  calculationType: {
    type: String,
    enum: ['watts', 'kwh', 'units', 'monthly_bill'],
    default: 'watts'
  },
  // Conversion rates (updated periodically)
  conversionRates: {
    USD: { type: Number, default: 1 },
    INR: { type: Number, default: 83.5 }, // 1 USD = 83.5 INR (approximate)
    EUR: { type: Number, default: 0.85 },
    GBP: { type: Number, default: 0.73 },
    JPY: { type: Number, default: 110 },
    AUD: { type: Number, default: 1.35 },
    CAD: { type: Number, default: 1.25 }
  },
  // Country-specific electricity rates (per kWh)
  countryRates: {
    US: { type: Number, default: 0.12 }, // $0.12 per kWh
    IN: { type: Number, default: 6.5 },   // ₹6.5 per kWh
    EU: { type: Number, default: 0.25 },  // €0.25 per kWh
    UK: { type: Number, default: 0.20 },  // £0.20 per kWh
    JP: { type: Number, default: 25 },    // ¥25 per kWh
    AU: { type: Number, default: 0.30 },  // A$0.30 per kWh
    CA: { type: Number, default: 0.15 }   // C$0.15 per kWh
  },
  preferences: {
    showInDashboard: { type: Boolean, default: true },
    showRealTimeCalculation: { type: Boolean, default: true },
    showDailyEstimate: { type: Boolean, default: true },
    showMonthlyEstimate: { type: Boolean, default: true },
    showCarbonFootprint: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Method to get electricity cost in user's currency
userMoneySelectionSchema.methods.calculateCost = function(powerInWatts, hours = 1) {
  const kWh = (powerInWatts * hours) / 1000;
  const costInUserCurrency = kWh * this.electricityRate;
  
  return {
    kWh: kWh,
    cost: costInUserCurrency,
    currency: this.currency,
    symbol: this.currencySymbol,
    costPerHour: (powerInWatts / 1000) * this.electricityRate,
    costPerDay: (powerInWatts / 1000) * 24 * this.electricityRate,
    costPerMonth: (powerInWatts / 1000) * 24 * 30 * this.electricityRate
  };
};

// Method to convert cost to different currency
userMoneySelectionSchema.methods.convertCurrency = function(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = this.conversionRates[fromCurrency] || 1;
  const toRate = this.conversionRates[toCurrency] || 1;
  
  return (amount / fromRate) * toRate;
};

// Update conversion rates method
userMoneySelectionSchema.methods.updateConversionRates = function(rates) {
  this.conversionRates = { ...this.conversionRates, ...rates };
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('UserMoneySelection', userMoneySelectionSchema);