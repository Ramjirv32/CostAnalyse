import { useState, useEffect } from 'react';
import { DollarSign, Globe, Calculator, Settings as SettingsIcon, Check, X } from 'lucide-react';

export default function CurrencySelection({ user, onUpdate, showInModal = false }) {
  const [preferences, setPreferences] = useState(null);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    currency: 'USD',
    currencySymbol: '$',
    country: 'US',
    electricityRate: 0.12,
    calculationType: 'watts',
    preferences: {
      showInDashboard: true,
      showRealTimeCalculation: true,
      showDailyEstimate: true,
      showMonthlyEstimate: true,
      showCarbonFootprint: false
    }
  });

  // Fetch current preferences and available currencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const [prefsRes, availableRes] = await Promise.all([
          fetch('http://localhost:5000/api/currency', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('http://localhost:5000/api/currency/available', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (prefsRes.ok) {
          const prefsData = await prefsRes.json();
          if (prefsData.success) {
            setPreferences(prefsData.data);
            setFormData(prev => ({
              ...prev,
              ...prefsData.data,
              preferences: { ...prev.preferences, ...prefsData.data.preferences }
            }));
          }
        }

        if (availableRes.ok) {
          const availableData = await availableRes.json();
          if (availableData.success) {
            setAvailableCurrencies(availableData.data.currencies);
          }
        }
      } catch (error) {
        console.error('Error fetching currency data:', error);
        setError('Failed to load currency preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCurrencyChange = (currency) => {
    const selectedCurrency = availableCurrencies.find(c => c.code === currency);
    if (selectedCurrency) {
      setFormData(prev => ({
        ...prev,
        currency: selectedCurrency.code,
        currencySymbol: selectedCurrency.symbol,
        country: selectedCurrency.country,
        // Set default electricity rate based on country
        electricityRate: getDefaultElectricityRate(selectedCurrency.country)
      }));
    }
  };

  const getDefaultElectricityRate = (country) => {
    const rates = {
      'US': 0.12,  // $0.12 per kWh
      'IN': 6.5,   // ₹6.5 per kWh
      'EU': 0.25,  // €0.25 per kWh
      'UK': 0.20,  // £0.20 per kWh
      'JP': 25,    // ¥25 per kWh
      'AU': 0.30,  // A$0.30 per kWh
      'CA': 0.15   // C$0.15 per kWh
    };
    return rates[country] || 0.12;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/currency', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      if (data.success) {
        setPreferences(data.data);
        setSuccess('Currency preferences saved successfully!');
        
        // Call the onUpdate callback if provided
        if (onUpdate) {
          onUpdate(data.data);
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error saving currency preferences:', error);
      setError(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span>Loading currency preferences...</span>
        </div>
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black rounded-lg">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-black">Currency & Calculation Preferences</h2>
          <p className="text-gray-600">Configure your currency and electricity cost calculations</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-600 rounded-lg">
          <X className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border-2 border-green-600 rounded-lg">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Currency Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            <Globe className="inline w-4 h-4 mr-1" />
            Select Currency & Country
          </label>
          <select
            value={formData.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="block w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white"
          >
            {availableCurrencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name} ({currency.countryName})
              </option>
            ))}
          </select>
        </div>

        {/* Electricity Rate */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            <Calculator className="inline w-4 h-4 mr-1" />
            Electricity Rate (per kWh)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-mono">
              {formData.currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={formData.electricityRate}
              onChange={(e) => setFormData(prev => ({ ...prev, electricityRate: parseFloat(e.target.value) || 0 }))}
              className="block w-full pl-8 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white"
              placeholder="Enter electricity rate"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Current rate: {formData.currencySymbol}{formData.electricityRate} per kWh
          </p>
        </div>

        {/* Calculation Type */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            <SettingsIcon className="inline w-4 h-4 mr-1" />
            Calculation Method
          </label>
          <select
            value={formData.calculationType}
            onChange={(e) => setFormData(prev => ({ ...prev, calculationType: e.target.value }))}
            className="block w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white"
          >
            <option value="watts">Power Rating (Watts)</option>
            <option value="kwh">Energy Consumption (kWh)</option>
            <option value="units">Electricity Units</option>
            <option value="monthly_bill">Monthly Bill Estimate</option>
          </select>
        </div>
      </div>

      {/* Display Preferences */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-black">Display Options</h3>
        
        {[
          { key: 'showInDashboard', label: 'Show in Dashboard', desc: 'Display cost calculations in main dashboard' },
          { key: 'showRealTimeCalculation', label: 'Real-time Calculation', desc: 'Show live cost calculations' },
          { key: 'showDailyEstimate', label: 'Daily Estimates', desc: 'Show daily cost estimates' },
          { key: 'showMonthlyEstimate', label: 'Monthly Estimates', desc: 'Show monthly cost estimates' },
          { key: 'showCarbonFootprint', label: 'Carbon Footprint', desc: 'Display environmental impact' }
        ].map(pref => (
          <div key={pref.key} className="flex items-start gap-3">
            <input
              type="checkbox"
              id={pref.key}
              checked={formData.preferences[pref.key]}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                preferences: { ...prev.preferences, [pref.key]: e.target.checked }
              }))}
              className="mt-1 w-4 h-4 text-black border-2 border-gray-300 rounded focus:ring-black"
            />
            <div>
              <label htmlFor={pref.key} className="text-sm font-medium text-black cursor-pointer">
                {pref.label}
              </label>
              <p className="text-xs text-gray-500">{pref.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sample Calculation */}
      {formData.electricityRate > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
          <h4 className="text-sm font-semibold text-black mb-2">Sample Calculation (100W device)</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Per Hour:</span>
              <span className="font-mono ml-2">{formData.currencySymbol}{((100 / 1000) * formData.electricityRate).toFixed(4)}</span>
            </div>
            <div>
              <span className="text-gray-600">Per Day:</span>
              <span className="font-mono ml-2">{formData.currencySymbol}{((100 / 1000) * 24 * formData.electricityRate).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Per Month:</span>
              <span className="font-mono ml-2">{formData.currencySymbol}{((100 / 1000) * 24 * 30 * formData.electricityRate).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Per Year:</span>
              <span className="font-mono ml-2">{formData.currencySymbol}{((100 / 1000) * 24 * 365 * formData.electricityRate).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 px-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving Preferences...
          </div>
        ) : (
          'Save Currency Preferences'
        )}
      </button>
    </div>
  );

  if (showInModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {content}
          <button
            onClick={() => onUpdate && onUpdate(null)}
            className="mt-4 w-full py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {content}
    </div>
  );
}