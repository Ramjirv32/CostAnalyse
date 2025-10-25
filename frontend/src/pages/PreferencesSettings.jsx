import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, Zap, Calculator, Save, RefreshCw } from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

export default function PreferencesSettings({ user, onBack }) {
  const { preferences, currencyOptions, updatePreferences, loadPreferences } = usePreferences();
  
  const [formData, setFormData] = useState({
    currency: 'USD',
    electricityRate: 0.12,
    powerUnit: 'watts',
    energyUnit: 'kWh',
    calculationMethod: 'electricity'
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load current preferences
  useEffect(() => {
    if (preferences) {
      setFormData({
        currency: preferences.currencyPreferences?.currency || 'USD',
        electricityRate: preferences.currencyPreferences?.electricityRate || 0.12,
        powerUnit: preferences.displayPreferences?.powerUnit || 'watts',
        energyUnit: preferences.displayPreferences?.energyUnit || 'kWh',
        calculationMethod: preferences.displayPreferences?.calculationMethod || 'electricity'
      });
    }
  }, [preferences]);

  const handleCurrencyChange = (e) => {
    const selectedCurrency = e.target.value;
    const currencyData = currencyOptions.find(opt => opt.code === selectedCurrency);
    
    setFormData(prev => ({
      ...prev,
      currency: selectedCurrency,
      electricityRate: currencyData?.defaultElectricityRate || prev.electricityRate
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const success = await updatePreferences(formData);
      
      if (success) {
        setMessage({ type: 'success', text: '✓ Preferences saved successfully!' });
        
        // Reload preferences to update the context
        await loadPreferences();
      } else {
        setMessage({ type: 'error', text: '✗ Failed to save preferences' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: '✗ Error saving preferences' });
    } finally {
      setSaving(false);
    }
  };

  // Get current currency data for display
  const currentCurrencyData = currencyOptions.find(opt => opt.code === formData.currency);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-6 border-b-4 border-black">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors rounded-lg"
                >
                  ← Back
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold">User Preferences</h1>
                <p className="text-gray-300 mt-1">Customize currency, units, and display settings</p>
              </div>
            </div>
            <SettingsIcon className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="max-w-4xl mx-auto mt-8 px-6 pb-12">
        <div className="bg-white rounded-xl shadow-lg border-4 border-black overflow-hidden">
          
          {/* Success/Error Message */}
          {message.text && (
            <div className={`p-4 border-b-4 ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-500 text-green-900' 
                : 'bg-red-50 border-red-500 text-red-900'
            }`}>
              <p className="font-bold">{message.text}</p>
            </div>
          )}

          <div className="p-8 space-y-8">
            
            {/* Currency & Country Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-black">
                <Globe className="w-6 h-6" />
                <h2 className="text-xl font-bold">Select Currency & Country</h2>
              </div>
              
              <div className="space-y-2">
                <select
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium text-lg"
                >
                  {currencyOptions.map(option => (
                    <option key={option.code} value={option.code}>
                      {option.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-px bg-gray-300"></div>

            {/* Electricity Rate Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-black">
                <Zap className="w-6 h-6" />
                <h2 className="text-xl font-bold">Electricity Rate (per kWh)</h2>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-lg">
                    {currentCurrencyData?.symbol || '$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.electricityRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, electricityRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-12 pr-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium text-lg"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Current rate: <span className="font-semibold">{currentCurrencyData?.symbol}{formData.electricityRate}</span> per kWh
                </p>
              </div>
            </div>

            <div className="h-px bg-gray-300"></div>

            {/* Calculation Method Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-black">
                <Calculator className="w-6 h-6" />
                <h2 className="text-xl font-bold">Calculation Method</h2>
              </div>
              
              <div className="space-y-2">
                <select
                  value={formData.calculationMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, calculationMethod: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium text-lg"
                >
                  <option value="electricity">Electricity Units</option>
                  <option value="carbon">Carbon Footprint</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-gray-300"></div>

            {/* Display Options Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-black">Display Options</h2>
              
              {/* Power Unit */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Power Unit:</label>
                <select
                  value={formData.powerUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, powerUnit: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black font-medium"
                >
                  <option value="watts">Watts (W)</option>
                  <option value="kilowatts">Kilowatts (kW)</option>
                </select>
              </div>

              {/* Energy Unit */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Energy Unit:</label>
                <select
                  value={formData.energyUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, energyUnit: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black font-medium"
                >
                  <option value="Wh">Watt-hours (Wh)</option>
                  <option value="kWh">Kilowatt-hours (kWh)</option>
                  <option value="MWh">Megawatt-hours (MWh)</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-black text-white font-bold text-lg rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">Current Settings Summary:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-blue-800">Currency:</span>
              <p className="text-blue-900">{currentCurrencyData?.name || formData.currency}</p>
            </div>
            <div>
              <span className="font-semibold text-blue-800">Electricity Rate:</span>
              <p className="text-blue-900">{currentCurrencyData?.symbol}{formData.electricityRate}/kWh</p>
            </div>
            <div>
              <span className="font-semibold text-blue-800">Power Display:</span>
              <p className="text-blue-900">{formData.powerUnit === 'watts' ? 'Watts (W)' : 'Kilowatts (kW)'}</p>
            </div>
            <div>
              <span className="font-semibold text-blue-800">Energy Display:</span>
              <p className="text-blue-900">{formData.energyUnit}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
