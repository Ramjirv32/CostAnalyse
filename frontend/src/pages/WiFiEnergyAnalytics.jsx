import { useState, useEffect } from 'react';
import {
  Wifi,
  Zap,
  Activity,
  DollarSign,
  TrendingUp,
  Cpu,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { usePreferences } from '../contexts/PreferencesContext';

export default function WiFiEnergyAnalytics({ user, onBack }) {
  const { formatPower, formatEnergy, formatCurrency } = usePreferences();
  const [wifiDevices, setWifiDevices] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedESP32, setSelectedESP32] = useState('all');

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedESP32]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch WiFi energy devices, analytics, and summary
      const [devicesRes, analyticsRes, summaryRes] = await Promise.all([
        fetch('http://localhost:5000/api/wifi-energy/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:5000/api/wifi-energy/analytics/latest`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wifi-energy/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        if (devicesData.success) {
          setWifiDevices(devicesData.data);
        }
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        if (analyticsData.success) {
          setAnalytics(analyticsData.data);
        }
      }

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setSummary(summaryData.data);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching WiFi energy data:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const syncDevices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/wifi-energy/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error syncing devices:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter analytics by selected ESP32
  const filteredAnalytics = selectedESP32 === 'all' 
    ? analytics 
    : analytics.filter(a => a.esp32Name === selectedESP32);

  // Prepare chart data
  const chartData = filteredAnalytics.map(a => ({
    name: a.deviceName,
    power: a.currentPower,
    dailyCost: a.costPerDay,
    monthlyCost: a.costPerMonth
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span>Loading WiFi Energy Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white p-6 border-b-4 border-black">
        <div className="max-w-7xl mx-auto">
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
                <h1 className="text-3xl font-bold">WiFi Energy Analytics</h1>
                <p className="text-gray-300 mt-1">Real-time energy monitoring for WiFi-connected devices</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={syncDevices}
                className="px-4 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors rounded-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Devices
              </button>
              <Activity className="w-12 h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-900 px-6 py-4 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="max-w-7xl mx-auto mt-6 px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-black rounded-lg">
                  <Cpu className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">ESP32 Controllers</p>
                  <p className="text-2xl font-bold text-black">{summary.totalESP32Controllers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Wifi className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Connected Devices</p>
                  <p className="text-2xl font-bold text-black">{summary.totalConnectedDevices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-500 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Current Power</p>
                  <p className="text-2xl font-bold text-black">{formatPower(summary.currentTotalPower)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Monthly Cost</p>
                  <p className="text-2xl font-bold text-black">
                    {formatCurrency(summary.totalMonthlyCost)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESP32 Filter */}
      <div className="max-w-7xl mx-auto mt-6 px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-semibold text-black mb-2">Filter by ESP32 Controller:</label>
          <select
            value={selectedESP32}
            onChange={(e) => setSelectedESP32(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
          >
            <option value="all">All ESP32 Controllers</option>
            {wifiDevices.map(device => (
              <option key={device._id} value={device.esp32Name}>
                {device.esp32Name} ({device.totalConnectedDevices} devices)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts */}
      {filteredAnalytics.length > 0 && (
        <div className="max-w-7xl mx-auto mt-6 px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Power Consumption Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Current Power Consumption
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="power" fill="#000000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Daily Cost Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="dailyCost" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Device Table */}
      <div className="max-w-7xl mx-auto mt-6 px-6 pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xl font-bold text-black flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Device Energy Details
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">ESP32 Controller</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Power Rating</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Current Power</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Voltage</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Current</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Hour</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Day</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Month</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnalytics.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-black">{item.deviceName}</div>
                      <div className="text-xs text-gray-500">{item.deviceType}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-semibold">
                          📡 {item.esp32Name}
                        </span>
                        {item.esp32Location && (
                          <span className="text-xs text-gray-500 mt-1">
                            📍 {item.esp32Location}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-700">{formatPower(item.powerRating)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-black">{formatPower(item.currentPower)}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">{item.voltage.toFixed(1)}V</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-600">{item.current.toFixed(2)}A</td>
                    <td className="py-3 px-4 text-right font-mono text-green-600 font-semibold">
                      {formatCurrency(item.costPerHour)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-600 font-semibold">
                      {formatCurrency(item.costPerDay)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-purple-600 font-semibold">
                      {formatCurrency(item.costPerMonth)}
                    </td>
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
