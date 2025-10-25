import { createContext, useContext, useState, useEffect } from 'react';

const PreferencesContext = createContext();

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    currencyPreferences: {
      currency: 'USD',
      currencySymbol: '$',
      country: 'United States',
      electricityRate: 0.12,
      conversionRate: 1.0
    },
    displayPreferences: {
      powerUnit: 'watts',
      energyUnit: 'kWh',
      calculationMethod: 'electricity'
    }
  });

  const [loading, setLoading] = useState(true);
  const [currencyOptions, setCurrencyOptions] = useState([]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
    loadCurrencyOptions();
  }, []);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrencyOptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/preferences/currency-options');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrencyOptions(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading currency options:', error);
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('http://localhost:5000/api/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreferences(data.data);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  };

  // Helper functions for formatting
  const formatPower = (watts) => {
    const { powerUnit } = preferences.displayPreferences;
    if (powerUnit === 'kilowatts') {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
    return `${watts.toFixed(2)} W`;
  };

  const formatEnergy = (kWh) => {
    const { energyUnit } = preferences.displayPreferences;
    switch (energyUnit) {
      case 'Wh':
        return `${(kWh * 1000).toFixed(2)} Wh`;
      case 'MWh':
        return `${(kWh / 1000).toFixed(4)} MWh`;
      default:
        return `${kWh.toFixed(3)} kWh`;
    }
  };

  const formatCurrency = (amount) => {
    const { currencySymbol } = preferences.currencyPreferences;
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const calculateCost = (energyKWh) => {
    const { electricityRate } = preferences.currencyPreferences;
    return energyKWh * electricityRate;
  };

  const getCurrencySymbol = () => {
    return preferences.currencyPreferences.currencySymbol;
  };

  const getElectricityRate = () => {
    return preferences.currencyPreferences.electricityRate;
  };

  const value = {
    preferences,
    loading,
    currencyOptions,
    updatePreferences,
    loadPreferences,
    formatPower,
    formatEnergy,
    formatCurrency,
    calculateCost,
    getCurrencySymbol,
    getElectricityRate
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
