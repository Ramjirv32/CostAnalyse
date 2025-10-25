const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Currency and country data
const CURRENCY_DATA = {
  'USD': { symbol: '$', name: 'US Dollar', country: 'United States', rate: 0.12 },
  'EUR': { symbol: '€', name: 'Euro', country: 'European Union', rate: 0.28 },
  'GBP': { symbol: '£', name: 'British Pound', country: 'United Kingdom', rate: 0.24 },
  'INR': { symbol: '₹', name: 'Indian Rupee', country: 'India', rate: 6.5 },
  'JPY': { symbol: '¥', name: 'Japanese Yen', country: 'Japan', rate: 17 },
  'CNY': { symbol: '¥', name: 'Chinese Yuan', country: 'China', rate: 0.65 },
  'AUD': { symbol: 'A$', name: 'Australian Dollar', country: 'Australia', rate: 0.25 },
  'CAD': { symbol: 'C$', name: 'Canadian Dollar', country: 'Canada', rate: 0.13 },
  'CHF': { symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland', rate: 0.21 },
  'SEK': { symbol: 'kr', name: 'Swedish Krona', country: 'Sweden', rate: 1.5 }
};

const CONVERSION_RATES = {
  'USD': 1.0,
  'EUR': 0.92,
  'GBP': 0.79,
  'INR': 83.12,
  'JPY': 149.50,
  'CNY': 7.24,
  'AUD': 1.53,
  'CAD': 1.36,
  'CHF': 0.88,
  'SEK': 10.87
};

// @route   GET /api/preferences/currency-options
// @desc    Get available currency options
// @access  Public
router.get('/currency-options', (req, res) => {
  try {
    const options = Object.entries(CURRENCY_DATA).map(([code, data]) => ({
      code,
      symbol: data.symbol,
      name: data.name,
      country: data.country,
      displayName: `${data.symbol} ${code} - ${data.name} (${data.country})`,
      defaultElectricityRate: data.rate
    }));

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Get currency options error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get currency options',
      error: error.message
    });
  }
});

// @route   GET /api/preferences
// @desc    Get user preferences
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize preferences if not set
    if (!user.currencyPreferences) {
      user.currencyPreferences = {
        currency: 'USD',
        currencySymbol: '$',
        country: 'United States',
        electricityRate: 0.12,
        conversionRate: 1.0
      };
    }

    if (!user.displayPreferences) {
      user.displayPreferences = {
        powerUnit: 'watts',
        energyUnit: 'kWh',
        calculationMethod: 'electricity'
      };
    }

    await user.save();

    res.json({
      success: true,
      data: {
        currencyPreferences: user.currencyPreferences,
        displayPreferences: user.displayPreferences
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message
    });
  }
});

// @route   PUT /api/preferences/currency
// @desc    Update currency preferences
// @access  Private
router.put('/currency', auth, async (req, res) => {
  try {
    const { currency, electricityRate } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get currency data
    const currencyData = CURRENCY_DATA[currency];
    if (!currencyData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency code'
      });
    }

    // Update currency preferences
    user.currencyPreferences = {
      currency,
      currencySymbol: currencyData.symbol,
      country: currencyData.country,
      electricityRate: electricityRate || currencyData.rate,
      conversionRate: CONVERSION_RATES[currency] || 1.0
    };

    await user.save();

    res.json({
      success: true,
      message: 'Currency preferences updated',
      data: user.currencyPreferences
    });
  } catch (error) {
    console.error('Update currency preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency preferences',
      error: error.message
    });
  }
});

// @route   PUT /api/preferences/display
// @desc    Update display preferences
// @access  Private
router.put('/display', auth, async (req, res) => {
  try {
    const { powerUnit, energyUnit, calculationMethod } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update display preferences
    if (!user.displayPreferences) {
      user.displayPreferences = {};
    }

    if (powerUnit) user.displayPreferences.powerUnit = powerUnit;
    if (energyUnit) user.displayPreferences.energyUnit = energyUnit;
    if (calculationMethod) user.displayPreferences.calculationMethod = calculationMethod;

    await user.save();

    res.json({
      success: true,
      message: 'Display preferences updated',
      data: user.displayPreferences
    });
  } catch (error) {
    console.error('Update display preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update display preferences',
      error: error.message
    });
  }
});

// @route   PUT /api/preferences
// @desc    Update all preferences
// @access  Private
router.put('/', auth, async (req, res) => {
  try {
    const { currency, electricityRate, powerUnit, energyUnit, calculationMethod } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update currency preferences if provided
    if (currency) {
      const currencyData = CURRENCY_DATA[currency];
      if (currencyData) {
        user.currencyPreferences = {
          currency,
          currencySymbol: currencyData.symbol,
          country: currencyData.country,
          electricityRate: electricityRate !== undefined ? electricityRate : currencyData.rate,
          conversionRate: CONVERSION_RATES[currency] || 1.0
        };
      }
    } else if (electricityRate !== undefined) {
      // Just update electricity rate
      if (!user.currencyPreferences) {
        user.currencyPreferences = {};
      }
      user.currencyPreferences.electricityRate = electricityRate;
    }

    // Update display preferences if provided
    if (!user.displayPreferences) {
      user.displayPreferences = {};
    }

    if (powerUnit) user.displayPreferences.powerUnit = powerUnit;
    if (energyUnit) user.displayPreferences.energyUnit = energyUnit;
    if (calculationMethod) user.displayPreferences.calculationMethod = calculationMethod;

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        currencyPreferences: user.currencyPreferences,
        displayPreferences: user.displayPreferences
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

module.exports = router;
