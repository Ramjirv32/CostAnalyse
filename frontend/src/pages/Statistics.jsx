import { useState, useEffect } from 'react';
import { Activity, Zap, TrendingUp, Clock, DollarSign, Calendar, Wifi, RefreshCw, Monitor } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart 
} from 'recharts';

export default function Statistics() {
  const [timeRange, setTimeRange] = useState('week'); // day, week, month
  const [chartData, setChartData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [currencyPreferences, setCurrencyPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataType, setDataType] = useState('all'); // 'all', 'wifi', 'local'

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
      
      // Fetch all required data in parallel
      const [chartsRes, devicesRes, wifiRes, currencyRes] = await Promise.all([
        fetch(`http://localhost:5000/api/energy/charts?days=${days}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wifi-management/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/currency', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      // Process charts data
      if (chartsRes.ok) {
        const chartsData = await chartsRes.json();
        if (chartsData.success && chartsData.data.length > 0) {
          const formatted = chartsData.data.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              ...(timeRange === 'day' && { hour: '2-digit' })
            }),
            usage: parseFloat(item.usage),
            cost: parseFloat(item.cost),
            efficiency: Math.random() * 20 + 80 // Mock efficiency data
          }));
          setChartData(formatted);
        } else {
          generateSampleData();
        }
      } else {
        generateSampleData();
      }

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

      // Process currency data
      if (currencyRes.ok) {
        const currencyData = await currencyRes.json();
        if (currencyData.success) {
          setCurrencyPreferences(currencyData.data);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      generateSampleData();
      setLoading(false);
    }
  };

  // Format currency based on user preferences
  const formatCurrency = (amount, decimals = 2) => {
    // Ensure amount is a valid number
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    
    if (!currencyPreferences) return `$${numAmount.toFixed(decimals)}`;
    
    const symbol = currencyPreferences.currencySymbol || '$';
    const rate = currencyPreferences.electricityRate || 0.12;
    const conversionRate = currencyPreferences.conversionRates?.[currencyPreferences.selectedCurrency] || 1;
    const convertedAmount = numAmount * conversionRate * (rate / 0.12);
    
    return `${symbol}${convertedAmount.toFixed(decimals)}`;
  };

  // Get filtered device statistics
  const getDeviceStats = () => {
    let filteredDevices = devices;
    
    if (dataType === 'wifi') {
      const wifiDeviceIds = wifiDevices
        .filter(wd => wd.connectionStatus === 'connected')
        .map(wd => wd.deviceId);
      filteredDevices = devices.filter(device => wifiDeviceIds.includes(device._id));
    } else if (dataType === 'local') {
      const wifiDeviceIds = wifiDevices
        .filter(wd => wd.connectionStatus === 'connected')
        .map(wd => wd.deviceId);
      filteredDevices = devices.filter(device => !wifiDeviceIds.includes(device._id));
    }

    const totalPower = filteredDevices.reduce((sum, device) => sum + device.powerRating, 0);
    const activeDevices = filteredDevices.filter(device => device.status === 'online');
    const totalActivePower = activeDevices.reduce((sum, device) => sum + device.powerRating, 0);
    
    const rate = currencyPreferences?.electricityRate || 0.12;
    const dailyConsumption = (totalActivePower / 1000) * 24;
    const dailyCost = dailyConsumption * rate;

    return {
      totalDevices: filteredDevices.length,
      activeDevices: activeDevices.length,
      totalPower,
      totalActivePower,
      dailyConsumption,
      dailyCost,
      monthlyCost: dailyCost * 30,
      efficiency: activeDevices.length > 0 ? (totalActivePower / totalPower) * 100 : 0
    };
  };

  const generateSampleData = () => {
    const days = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        usage: (Math.random() * 10 + 10).toFixed(2),
        cost: (Math.random() * 2 + 2).toFixed(2)
      });
    }
    setChartData(data);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span>Loading usage statistics...</span>
        </div>
      </div>
    );
  }

  const totalUsage = chartData.reduce((sum, d) => sum + parseFloat(d.usage), 0);
  const totalCost = chartData.reduce((sum, d) => sum + parseFloat(d.cost), 0);
  const avgUsage = totalUsage / (chartData.length || 1);
  const avgCost = totalCost / (chartData.length || 1);
  const deviceStats = getDeviceStats();

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header with Controls */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Usage Statistics</h1>
              <p className="text-sm md:text-base text-gray-600">Device-based energy analysis and cost insights</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchStatistics}
                className="p-2 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Data Type Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setDataType('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                dataType === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              All Devices ({devices.length})
            </button>
            <button
              onClick={() => setDataType('wifi')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                dataType === 'wifi' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Wifi className="w-4 h-4" />
              WiFi Connected ({wifiDevices.filter(wd => wd.connectionStatus === 'connected').length})
            </button>
            <button
              onClick={() => setDataType('local')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dataType === 'local' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Local Only ({devices.length - wifiDevices.filter(wd => wd.connectionStatus === 'connected').length})
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              timeRange === 'day' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              timeRange === 'week' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              timeRange === 'month' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
        </div>

        {/* Summary Cards */}
                {/* Device Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Devices</p>
                <p className="text-2xl font-bold text-blue-900">{deviceStats.total}</p>
                <p className="text-xs text-blue-500 mt-1">Registered devices</p>
              </div>
              <Activity className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">WiFi Connected</p>
                <p className="text-2xl font-bold text-green-900">{deviceStats.wifiConnected}</p>
                <p className="text-xs text-green-500 mt-1">Online & monitoring</p>
              </div>
              <Wifi className="h-10 w-10 text-green-500" />
            </div>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Local Only</p>
                <p className="text-2xl font-bold text-orange-900">{deviceStats.localOnly}</p>
                <p className="text-xs text-orange-500 mt-1">Manual monitoring</p>
              </div>
              <Monitor className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Total Usage</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{totalUsage.toFixed(2)} kWh</p>
                <p className="text-xs text-gray-400 mt-1">{dataType === 'all' ? 'All devices' : dataType === 'wifi' ? 'WiFi devices' : 'Local devices'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Total Cost</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
                <p className="text-xs text-gray-400 mt-1">In {currencyPreferences?.selectedCurrency || 'USD'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Avg Usage</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{avgUsage.toFixed(2)} kWh</p>
                <p className="text-xs text-gray-400 mt-1">Per device daily</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-500">Avg Cost</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(avgCost)}</p>
                <p className="text-xs text-gray-400 mt-1">Per device daily</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 1: Enhanced Energy Usage Flow */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">📊 Energy Usage Flow</h3>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">
                {dataType === 'all' ? 'All Devices' : dataType === 'wifi' ? 'WiFi Connected' : 'Local Only'} 
                ({dataType === 'all' ? devices.length : dataType === 'wifi' ? deviceStats.wifiConnected : deviceStats.localOnly} devices)
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Usage (kWh)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`${value} kWh`, 'Energy Usage']}
                labelStyle={{ color: '#333' }}
              />
              <Area 
                type="monotone" 
                dataKey="usage" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorUsage)" 
                name="Energy Usage (kWh)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chart 2: Enhanced Usage vs Cost Correlation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">🔵 Usage vs Cost Analysis</h3>
              <div className="text-xs text-gray-500">
                Rate: {currencyPreferences?.electricityRate || 0.12} per kWh
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="usage" 
                  name="Usage" 
                  unit=" kWh" 
                  label={{ value: 'Usage (kWh)', position: 'insideBottom', offset: -5 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="cost" 
                  name="Cost" 
                  unit={` ${currencyPreferences?.selectedCurrency || 'USD'}`}
                  label={{ value: `Cost (${currencyPreferences?.selectedCurrency || 'USD'})`, angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <ZAxis range={[100, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === 'Cost' ? formatCurrency(value) : `${value} kWh`,
                    name
                  ]}
                />
                <Scatter 
                  name="Usage vs Cost" 
                  data={chartData} 
                  fill="#EF4444"
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Enhanced Performance Radar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">⭐ Weekly Performance</h3>
              <div className="text-xs text-gray-500">
                {dataType === 'wifi' ? 'WiFi Devices Only' : dataType === 'local' ? 'Local Devices Only' : 'All Devices'}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData.slice(0, 7)}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 'auto']}
                  tick={{ fontSize: 10 }}
                />
                <Radar 
                  name="Usage (kWh)" 
                  dataKey="usage" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar 
                  name={`Cost (${currencyPreferences?.selectedCurrency || 'USD'})`}
                  dataKey="cost" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend />
                <Tooltip 
                  formatter={(value, name) => [
                    name.includes('Cost') ? formatCurrency(value) : `${value} kWh`,
                    name
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Enhanced Daily Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">📈 Daily Usage & Cost Breakdown</h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Usage</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Cost</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  name.includes('Cost') ? formatCurrency(value) : `${value} kWh`,
                  name
                ]}
                labelStyle={{ color: '#333' }}
              />
              <Bar 
                dataKey="usage" 
                fill="#3B82F6" 
                name="Usage (kWh)"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="cost" 
                fill="#10B981" 
                name={`Cost (${currencyPreferences?.selectedCurrency || 'USD'})`}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 5: Enhanced Cost Trend Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-black">📉 Cost Trend Analysis</h3>
            <div className="text-sm text-gray-600">
              Avg: {formatCurrency(avgCost)}/day
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: `Cost (${currencyPreferences?.selectedCurrency || 'USD'})`, angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Daily Cost']}
                labelStyle={{ color: '#333' }}
              />
              <Line 
                type="monotoneX" 
                dataKey="cost" 
                stroke="#EC4899" 
                strokeWidth={3} 
                dot={{ fill: '#EC4899', r: 5, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7, stroke: '#EC4899', strokeWidth: 2, fill: '#fff' }}
                name={`Cost (${currencyPreferences?.selectedCurrency || 'USD'})`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
