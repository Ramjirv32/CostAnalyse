const express = require('express');
const UserMoneySelection = require('../models/UserMoneySelection');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's currency preferences
router.get('/', auth, async (req, res) => {
  try {
    const userPrefs = await UserMoneySelection.findOne({ userId: req.user.id });
    
    if (!userPrefs) {
      // Create default preferences for new users
      const defaultPrefs = new UserMoneySelection({
        userId: req.user.id,
        email: req.user.email,
        currency: 'USD',
        currencySymbol: '$',
        country: 'US',
        electricityRate: 0.12, // Default US rate
        calculationType: 'watts'
      });
      
      const saved = await defaultPrefs.save();
      return res.json({
        success: true,
        data: saved,
        message: 'Default currency preferences created'
      });
    }
    
    res.json({
      success: true,
      data: userPrefs
    });
  } catch (error) {
    console.error('Error fetching currency preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch currency preferences'
    });
  }
});

// Update user's currency preferences
router.put('/', auth, async (req, res) => {
  try {
    const {
      currency,
      currencySymbol,
      country,
      electricityRate,
      calculationType,
      preferences
    } = req.body;

    // Validate currency and country
    const validCurrencies = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
    const validCountries = ['US', 'IN', 'EU', 'UK', 'JP', 'AU', 'CA'];

    if (currency && !validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency selected'
      });
    }

    if (country && !validCountries.includes(country)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid country selected'
      });
    }

    const updateData = {
      email: req.user.email,
      updatedAt: new Date()
    };

    if (currency) updateData.currency = currency;
    if (currencySymbol) updateData.currencySymbol = currencySymbol;
    if (country) updateData.country = country;
    if (electricityRate !== undefined) updateData.electricityRate = electricityRate;
    if (calculationType) updateData.calculationType = calculationType;
    if (preferences) updateData.preferences = { ...updateData.preferences, ...preferences };

    const userPrefs = await UserMoneySelection.findOneAndUpdate(
      { userId: req.user.id },
      updateData,
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: userPrefs,
      message: 'Currency preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating currency preferences:', error);
    
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
      error: 'Failed to update currency preferences'
    });
  }
});

// Calculate cost for specific power consumption
router.post('/calculate', auth, async (req, res) => {
  try {
    const { powerInWatts, hours = 1, deviceName = 'Unknown Device' } = req.body;

    if (!powerInWatts || powerInWatts <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid power consumption in watts is required'
      });
    }

    const userPrefs = await UserMoneySelection.findOne({ userId: req.user.id });
    
    if (!userPrefs) {
      return res.status(404).json({
        success: false,
        error: 'Currency preferences not found. Please set your preferences first.'
      });
    }

    const calculation = userPrefs.calculateCost(powerInWatts, hours);

    res.json({
      success: true,
      data: {
        deviceName,
        powerInWatts,
        hours,
        calculation,
        userPreferences: {
          currency: userPrefs.currency,
          symbol: userPrefs.currencySymbol,
          country: userPrefs.country,
          electricityRate: userPrefs.electricityRate
        }
      }
    });
  } catch (error) {
    console.error('Error calculating cost:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate cost'
    });
  }
});

// Get available currencies and their info
router.get('/available', async (req, res) => {
  try {
    const currencies = [
      { code: 'USD', symbol: '$', name: 'US Dollar', country: 'US', countryName: 'United States' },
      { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'IN', countryName: 'India' },
      { code: 'EUR', symbol: '€', name: 'Euro', country: 'EU', countryName: 'European Union' },
      { code: 'GBP', symbol: '£', name: 'British Pound', country: 'UK', countryName: 'United Kingdom' },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'JP', countryName: 'Japan' },
      { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'AU', countryName: 'Australia' },
      { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'CA', countryName: 'Canada' }
    ];

    const calculationTypes = [
      { value: 'watts', label: 'Power Rating (Watts)', description: 'Calculate based on device power rating' },
      { value: 'kwh', label: 'Energy Consumption (kWh)', description: 'Calculate based on energy consumption' },
      { value: 'units', label: 'Electricity Units', description: 'Calculate based on electricity meter units' },
      { value: 'monthly_bill', label: 'Monthly Bill Estimate', description: 'Estimate based on monthly usage' }
    ];

    res.json({
      success: true,
      data: {
        currencies,
        calculationTypes
      }
    });
  } catch (error) {
    console.error('Error fetching available currencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available currencies'
    });
  }
});

// Update conversion rates (admin only or periodic job)
router.post('/update-rates', auth, async (req, res) => {
  try {
    // This would typically be called by an admin or a scheduled job
    // For demo purposes, we'll allow any authenticated user
    
    const { conversionRates } = req.body;
    
    if (!conversionRates) {
      return res.status(400).json({
        success: false,
        error: 'Conversion rates data is required'
      });
    }

    // Update all users' conversion rates
    const result = await UserMoneySelection.updateMany(
      {},
      {
        $set: {
          conversionRates: conversionRates,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        conversionRates
      },
      message: 'Conversion rates updated successfully'
    });
  } catch (error) {
    console.error('Error updating conversion rates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conversion rates'
    });
  }
});

module.exports = router;