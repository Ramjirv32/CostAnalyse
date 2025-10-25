import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Zap, DollarSign, Award, Clock, Wifi, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePreferences } from '../contexts/PreferencesContext';

const COLORS = ['#000000', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

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
      
      // Use preferences for calculations
      const dailyConsumption = (device.powerRating / 1000) * (device.status === 'online' ? 24 : 8); // kWh
      const dailyCost = calculateCost(dailyConsumption);
      const monthlyCost = dailyCost * 30;
      
      return {
        name: device.name.length > 10 ? device.name.substring(0, 10) + '...' : device.name,
        fullName: device.name,
        power: device.powerRating,
        dailyCost,
        monthlyCost,
        dailyConsumption,
        monthlyConsumption: dailyConsumption * 30,
        usage: device.status === 'online' ? device.powerRating * 24 : device.powerRating * 8,
        status: device.status,
        isWifiConnected,
        esp32Name: esp32Info?.name || (isWifiConnected ? 'Unknown ESP32' : 'Not Connected'),
        esp32Location: esp32Info?.location || '-',
        efficiency: device.status === 'online' ? 95 : 60 // Mock efficiency
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
        </div>
      </div>
    );
  }

  // Generate current analytics data based on filters
  const currentEnergyData = generateAnalyticsData();

  // Calculate statistics
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
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                  💰 {preferences.currencyPreferences.currencySymbol} {preferences.currencyPreferences.currency} - {preferences.currencyPreferences.country}
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
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === 'dailyCost' ? 'Daily Cost' : name
                  ]}
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
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Monthly Cost']}
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
