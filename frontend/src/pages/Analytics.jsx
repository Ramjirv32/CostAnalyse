import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Zap, DollarSign, Award, Clock, Wifi, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePreferences } from '../contexts/PreferencesContext';

const COLORS = ['#000000', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

/**
 * Analytics Component
 * 
 * This component displays energy consumption and cost analytics for all devices.
 * 
 * IMPORTANT - Currency Handling:
 * - All cost calculations use currency preferences stored in backend (MongoDB)
 * - Supported currencies: USD, EUR, GBP, INR, JPY, CNY, AUD, CAD, CHF, SEK
 * - Each currency has its own electricity rate (e.g., $0.12/kWh for USD, ₹6.5/kWh for INR)
 * - Currency preferences are loaded via PreferencesContext from /api/preferences
 * - All charts, tables, and statistics automatically use the correct currency symbol and rates
 * - Cost calculations: dailyCost = dailyConsumption (kWh) × electricityRate (from backend)
 * 
 * The component will not render until preferences are loaded to ensure accuracy.
 */
export default function Analytics() {
  const { preferences, formatPower, formatEnergy, formatCurrency, calculateCost, loading: prefsLoading } = usePreferences();
  const [devices, setDevices] = useState([]);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [esp32Controllers, setEsp32Controllers] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState('all'); // 'all', 'wifi', 'offline'

  useEffect(() => {
    // Wait for preferences to load before fetching analytics
    if (!prefsLoading && preferences?.currencyPreferences) {
      console.log('📊 Analytics - Using Currency Preferences:', {
        currency: preferences.currencyPreferences.currency,
        symbol: preferences.currencyPreferences.currencySymbol,
        rate: preferences.currencyPreferences.electricityRate,
        country: preferences.currencyPreferences.country
      });
      
      // Check if we're using default values (indicates backend didn't load properly)
      if (preferences.currencyPreferences.currency === 'USD' && 
          preferences.currencyPreferences.electricityRate === 0.12) {
        console.warn('⚠️ Analytics - Using DEFAULT USD values! Backend preferences may not have loaded.');
      }
      
      fetchAnalyticsData();
    }
  }, [prefsLoading, preferences]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all data in parallel
      const [devicesRes, wifiRes, esp32Res] = await Promise.all([
        fetch('http://localhost:5000/api/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wifi/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wifi/esp32', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      // Process devices data
      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        if (devicesData.success) {
          setDevices(devicesData.data);
        }
      }

      // Process WiFi devices data
      if (wifiRes.ok) {
        const wifiData = await wifiRes.json();
        if (wifiData.success) {
          setWifiDevices(wifiData.data);
        }
      }

      // Process ESP32 controllers data
      if (esp32Res.ok) {
        const esp32Data = await esp32Res.json();
        if (esp32Data.success) {
          setEsp32Controllers(esp32Data.data);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  // Generate analytics data based on current devices and WiFi connections
  const generateAnalyticsData = () => {
    // Ensure preferences are loaded before calculations
    if (!preferences?.currencyPreferences?.electricityRate) {
      console.warn('⚠️ Analytics - Currency preferences not loaded yet');
      return [];
    }

    console.log('💰 Analytics - Calculating costs with:', {
      currency: preferences.currencyPreferences.currency,
      rate: preferences.currencyPreferences.electricityRate,
      symbol: preferences.currencyPreferences.currencySymbol
    });

    let filteredDevices = devices;

    // Apply filter
    if (deviceFilter === 'wifi') {
      const wifiDeviceIds = wifiDevices
        .filter(wd => wd.connectionStatus === 'connected')
        .map(wd => wd.deviceId);
      filteredDevices = devices.filter(device => wifiDeviceIds.includes(device._id));
    } else if (deviceFilter === 'offline') {
      filteredDevices = devices.filter(device => device.status === 'offline');
    }

    return filteredDevices.map(device => {
      const wifiConnection = wifiDevices.find(
        wd => wd.deviceId === device._id && wd.connectionStatus === 'connected'
      );
      
      const isWifiConnected = !!wifiConnection;
      
      // Get ESP32 info - check both from device.esp32Id and wifiConnection.esp32
      let esp32Info = null;
      if (device.esp32Id) {
        esp32Info = device.esp32Id; // Already populated from backend
      } else if (wifiConnection?.esp32) {
        esp32Info = wifiConnection.esp32; // From WiFi connection
      }
      
      // Calculate energy consumption in kWh
      const dailyConsumption = (device.powerRating / 1000) * (device.status === 'online' ? 24 : 8); // kWh
      
      // IMPORTANT: Use backend stored currency preferences for cost calculation
      // This ensures the correct currency (USD, INR, EUR, etc.) and rate are used
      const { electricityRate, currency, currencySymbol } = preferences.currencyPreferences;
      const dailyCost = dailyConsumption * electricityRate; // Cost in user's selected currency
      const monthlyCost = dailyCost * 30;
      
      return {
        name: device.name.length > 10 ? device.name.substring(0, 10) + '...' : device.name,
        fullName: device.name,
        power: device.powerRating,
        dailyCost, // Already in correct currency based on backend preferences
        monthlyCost, // Already in correct currency based on backend preferences
        dailyConsumption,
        monthlyConsumption: dailyConsumption * 30,
        usage: device.status === 'online' ? device.powerRating * 24 : device.powerRating * 8,
        status: device.status,
        isWifiConnected,
        esp32Name: esp32Info?.name || (isWifiConnected ? 'Unknown ESP32' : 'Not Connected'),
        esp32Location: esp32Info?.location || '-',
        efficiency: device.status === 'online' ? 95 : 60, // Mock efficiency
        // Store currency info for reference
        currency,
        currencySymbol
      };
    });
  };

  if (loading || prefsLoading) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span>Loading energy analytics and preferences...</span>
        </div>
      </div>
    );
  }

  // Check if preferences are loaded
  if (!preferences?.currencyPreferences) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600">
          <p className="font-bold">Unable to load currency preferences</p>
          <p className="text-sm mt-2">Please set your currency preferences in Settings</p>
          <p className="text-xs mt-4 text-gray-500">
            Make sure you have selected your currency (USD, INR, EUR, etc.) and electricity rate in the Settings page
          </p>
        </div>
      </div>
    );
  }

  // Check if we're using default values (backend didn't load user preferences)
  const isUsingDefaults = preferences.currencyPreferences.currency === 'USD' && 
                          preferences.currencyPreferences.electricityRate === 0.12 &&
                          preferences.currencyPreferences.country === 'United States';
  
  if (isUsingDefaults) {
    return (
      <div className="p-8 text-center">
        <div className="text-yellow-600">
          <p className="font-bold">⚠️ Using Default Currency Settings</p>
          <p className="text-sm mt-2">You haven't set your currency preferences yet</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 max-w-md mx-auto">
            <p className="text-sm text-gray-700 mb-2">Currently showing costs in:</p>
            <p className="font-semibold text-yellow-800">$ USD (United States) - $0.12/kWh</p>
            <button 
              onClick={() => window.location.href = '/preferences'} 
              className="mt-3 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Set Your Currency → Settings
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Analytics will show dummy data until you configure your currency preferences
          </p>
        </div>
      </div>
    );
  }

  // Additional safety check for electricity rate
  if (!preferences.currencyPreferences.electricityRate || preferences.currencyPreferences.electricityRate <= 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-yellow-600">
          <p className="font-bold">⚠️ Invalid Electricity Rate</p>
          <p className="text-sm mt-2">Your electricity rate is not set or invalid</p>
          <p className="text-xs mt-4 text-gray-500">
            Current rate: {preferences.currencyPreferences.electricityRate || 'Not Set'}<br/>
            Please update your electricity rate in Settings for accurate cost calculations
          </p>
        </div>
      </div>
    );
  }

  // Generate current analytics data based on filters
  // IMPORTANT: This uses backend stored currency preferences (USD, INR, EUR, etc.)
  const currentEnergyData = generateAnalyticsData();

  // Calculate statistics using the correct currency from backend
  // All monetary values will be in the user's selected currency with correct rates
  const totalDailyCost = currentEnergyData.reduce((sum, d) => sum + d.dailyCost, 0);
  const totalMonthlyConsumption = currentEnergyData.reduce((sum, d) => sum + d.monthlyConsumption, 0);
  const maxCostDevice = currentEnergyData.reduce((max, d) => d.dailyCost > max.dailyCost ? d : max, currentEnergyData[0] || {});
  const mostUsedDevice = currentEnergyData.reduce((max, d) => d.usage > max.usage ? d : max, currentEnergyData[0] || {});
  const avgPower = currentEnergyData.reduce((sum, d) => sum + d.power, 0) / (currentEnergyData.length || 1);
  const wifiConnectedCount = currentEnergyData.filter(d => d.isWifiConnected).length;
  const onlineDevicesCount = currentEnergyData.filter(d => d.status === 'online').length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Filter Options */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black mb-2">Energy Analytics</h1>
              <p className="text-gray-600">Detailed per-device energy consumption and cost analysis</p>
              
              {/* Currency & Unit Display */}
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className={`px-3 py-1 rounded-full font-semibold ${
                  preferences.currencyPreferences.currency === 'USD' && 
                  preferences.currencyPreferences.electricityRate === 0.12
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {preferences.currencyPreferences.currency === 'USD' && 
                   preferences.currencyPreferences.electricityRate === 0.12 ? '⚠️' : '💰'} {preferences.currencyPreferences.currencySymbol} {preferences.currencyPreferences.currency} - {preferences.currencyPreferences.country}
                  {preferences.currencyPreferences.currency === 'USD' && 
                   preferences.currencyPreferences.electricityRate === 0.12 && ' (DEFAULT)'}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold">
                  ⚡ Rate: {preferences.currencyPreferences.currencySymbol}{preferences.currencyPreferences.electricityRate}/kWh
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
                  🔌 Power: {preferences.displayPreferences.powerUnit === 'watts' ? 'Watts (W)' : 'Kilowatts (kW)'}
                </span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                  📊 Energy: {preferences.displayPreferences.energyUnit}
                </span>
              </div>
            </div>
            
            {/* Device Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setDeviceFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  deviceFilter === 'all' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Devices ({devices.length})
              </button>
              <button
                onClick={() => setDeviceFilter('wifi')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  deviceFilter === 'wifi' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Wifi className="w-4 h-4" />
                WiFi Connected ({wifiConnectedCount})
              </button>
              <button
                onClick={() => setDeviceFilter('offline')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  deviceFilter === 'offline' 
                    ? 'bg-black text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Offline ({devices.length - onlineDevicesCount})
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-black rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                {deviceFilter === 'all' ? 'All' : deviceFilter === 'wifi' ? 'WiFi' : 'Offline'}
              </span>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{formatCurrency(totalDailyCost)}</div>
            <h3 className="text-sm font-semibold text-gray-700">Daily Cost</h3>
            <p className="text-xs text-gray-500 mt-1">Monthly: {formatCurrency(totalDailyCost * 30)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{formatEnergy(totalMonthlyConsumption)}</div>
            <h3 className="text-sm font-semibold text-gray-700">Monthly Consumption</h3>
            <p className="text-xs text-gray-500 mt-1">Daily: {formatEnergy(totalMonthlyConsumption / 30)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{onlineDevicesCount}/{devices.length}</div>
            <h3 className="text-sm font-semibold text-gray-700">Active Devices</h3>
            <p className="text-xs text-gray-500 mt-1">WiFi: {wifiConnectedCount} connected</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{formatPower(avgPower)}</div>
            <h3 className="text-sm font-semibold text-gray-700">Average Power</h3>
            <p className="text-xs text-gray-500 mt-1">Per device rating</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{maxCostDevice?.name || 'N/A'}</div>
            <h3 className="text-sm font-semibold text-gray-700">Highest Cost Device</h3>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(maxCostDevice?.dailyCost || 0)}/day</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{mostUsedDevice?.name || 'N/A'}</div>
            <h3 className="text-sm font-semibold text-gray-700">Most Used Device</h3>
            <p className="text-xs text-gray-500 mt-1">{formatPower(mostUsedDevice?.power || 0)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{formatPower(avgPower)}</div>
            <h3 className="text-sm font-semibold text-gray-700">Average Power</h3>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Per-Device Cost Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">
              Daily Cost per Device
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({currentEnergyData.length} devices)
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentEnergyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis 
                  tickFormatter={(value) => `${preferences.currencyPreferences.currencySymbol}${value.toFixed(0)}`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    // Use backend stored currency for formatting
                    const currencySymbol = preferences.currencyPreferences.currencySymbol;
                    return [
                      `${currencySymbol}${value.toFixed(2)}`,
                      name === 'dailyCost' ? `Daily Cost (${preferences.currencyPreferences.currency})` : name
                    ];
                  }}
                  labelFormatter={(label) => {
                    const device = currentEnergyData.find(d => d.name === label);
                    return device ? device.fullName : label;
                  }}
                />
                <Bar dataKey="dailyCost" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Power Distribution Pie Chart with WiFi Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">
              Power Distribution
              <span className="text-sm font-normal text-gray-500 ml-2">
                (WiFi: {wifiConnectedCount} connected)
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={currentEnergyData}
                  dataKey="power"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.power}W`}
                >
                  {currentEnergyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isWifiConnected ? COLORS[index % COLORS.length] : '#D1D5DB'} 
                      stroke={entry.isWifiConnected ? '#000' : '#9CA3AF'}
                      strokeWidth={entry.isWifiConnected ? 2 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value}W`,
                    props.payload.isWifiConnected ? 'WiFi Connected' : 'Not Connected'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Cost Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">
              Monthly Cost Comparison
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Total: {formatCurrency(totalDailyCost * 30)})
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentEnergyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis 
                  tickFormatter={(value) => `${preferences.currencyPreferences.currencySymbol}${value.toFixed(0)}`}
                />
                <Tooltip 
                  formatter={(value) => {
                    // Use backend stored currency for formatting
                    const currencySymbol = preferences.currencyPreferences.currencySymbol;
                    return [
                      `${currencySymbol}${value.toFixed(2)}`,
                      `Monthly Cost (${preferences.currencyPreferences.currency})`
                    ];
                  }}
                  labelFormatter={(label) => {
                    const device = currentEnergyData.find(d => d.name === label);
                    return device ? `${device.fullName} (${device.status})` : label;
                  }}
                />
                <Bar 
                  dataKey="monthlyCost" 
                  fill="#3B82F6"
                  stroke="#1E40AF"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Device Efficiency and Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">
              Device Efficiency & Status
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Online: {onlineDevicesCount}/{devices.length})
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={currentEnergyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    name === 'dailyConsumption' ? formatEnergy(value) : `${value}%`,
                    name === 'dailyConsumption' ? 'Daily Consumption' : 'Efficiency'
                  ]}
                  labelFormatter={(label) => {
                    const device = currentEnergyData.find(d => d.name === label);
                    return device ? `${device.fullName} (${device.isWifiConnected ? 'WiFi' : 'Local'})` : label;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="dailyConsumption" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Device Details Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-black mb-4">
            Device Cost Breakdown ({currentEnergyData.length} devices)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">ESP32 Controller</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Connection</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Power</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Daily</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Monthly</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Yearly</th>
                </tr>
              </thead>
              <tbody>
                {currentEnergyData.map((device, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-black">{device.fullName}</div>
                      <div className="text-xs text-gray-500">{formatEnergy(device.dailyConsumption)}/day</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {device.isWifiConnected ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-semibold whitespace-nowrap">
                            📡 {device.esp32Name}
                          </span>
                          {device.esp32Location !== '-' && (
                            <span className="text-xs text-gray-500 mt-1">
                              📍 {device.esp32Location}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not Connected</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        device.status === 'online' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {device.isWifiConnected ? (
                        <Wifi className="w-4 h-4 text-blue-600 mx-auto" title="WiFi Connected" />
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded mx-auto" title="Local Only" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 font-mono">{formatPower(device.power)}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-semibold font-mono">{formatCurrency(device.dailyCost)}</td>
                    <td className="py-3 px-4 text-right text-blue-600 font-semibold font-mono">{formatCurrency(device.monthlyCost)}</td>
                    <td className="py-3 px-4 text-right text-purple-600 font-semibold font-mono">{formatCurrency(device.monthlyCost * 12)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
