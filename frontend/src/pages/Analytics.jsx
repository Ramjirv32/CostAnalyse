import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Zap, DollarSign, Award, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#000000', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
  const [devices, setDevices] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch devices
      const devicesRes = await fetch('http://localhost:5000/api/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const devicesData = await devicesRes.json();
      
      if (devicesData.success) {
        setDevices(devicesData.data);
        
        // Generate analytics data
        const analytics = devicesData.data.map(device => ({
          name: device.name,
          power: device.powerRating,
          dailyCost: (device.powerRating / 1000) * 24 * 0.20,
          monthlyCost: (device.powerRating / 1000) * 24 * 30 * 0.20,
          usage: device.status === 'online' ? device.powerRating * 24 : 0
        }));
        setEnergyData(analytics);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading analytics...</div>;
  }

  // Calculate statistics
  const totalDailyCost = energyData.reduce((sum, d) => sum + d.dailyCost, 0);
  const maxCostDevice = energyData.reduce((max, d) => d.dailyCost > max.dailyCost ? d : max, energyData[0] || {});
  const mostUsedDevice = energyData.reduce((max, d) => d.usage > max.usage ? d : max, energyData[0] || {});
  const avgPower = energyData.reduce((sum, d) => sum + d.power, 0) / energyData.length;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Energy Analytics</h1>
          <p className="text-gray-600">Detailed per-device energy consumption and cost analysis</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-black rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">${totalDailyCost.toFixed(2)}</div>
            <h3 className="text-sm font-semibold text-gray-700">Total Daily Cost</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{maxCostDevice?.name || 'N/A'}</div>
            <h3 className="text-sm font-semibold text-gray-700">Highest Cost Device</h3>
            <p className="text-xs text-gray-500 mt-1">${maxCostDevice?.dailyCost?.toFixed(2)}/day</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{mostUsedDevice?.name || 'N/A'}</div>
            <h3 className="text-sm font-semibold text-gray-700">Most Used Device</h3>
            <p className="text-xs text-gray-500 mt-1">{mostUsedDevice?.power}W</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-black mb-1">{avgPower.toFixed(0)}W</div>
            <h3 className="text-sm font-semibold text-gray-700">Average Power</h3>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Per-Device Cost Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">Daily Cost per Device</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="dailyCost" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Power Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">Power Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={energyData}
                  dataKey="power"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.power}W`}
                >
                  {energyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Cost Comparison */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">Monthly Cost Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Bar dataKey="monthlyCost" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Usage Area Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4">Daily Usage (kWh)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => `${(value / 1000).toFixed(2)} kWh`} />
                <Area type="monotone" dataKey="usage" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Details Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-black mb-4">Device Cost Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Power</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Daily Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Monthly Cost</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Yearly Cost</th>
                </tr>
              </thead>
              <tbody>
                {energyData.map((device, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-black">{device.name}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{device.power}W</td>
                    <td className="py-3 px-4 text-right text-green-600 font-semibold">${device.dailyCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-blue-600 font-semibold">${device.monthlyCost.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-purple-600 font-semibold">${(device.monthlyCost * 12).toFixed(2)}</td>
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
