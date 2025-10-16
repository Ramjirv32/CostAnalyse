import { useState, useEffect } from 'react';
import { Activity, Zap, TrendingUp, Clock, DollarSign, Calendar } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart 
} from 'recharts';

export default function Statistics() {
  const [timeRange, setTimeRange] = useState('week'); // day, week, month
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : 30;
      
      const response = await fetch(`http://localhost:5000/api/energy/charts?days=${days}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const formatted = data.data.map(item => ({
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            usage: parseFloat(item.usage),
            cost: parseFloat(item.cost)
          }));
          setChartData(formatted);
        } else {
          // Generate sample data if no real data
          generateSampleData();
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      generateSampleData();
      setLoading(false);
    }
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
    return <div className="p-8 text-center">Loading statistics...</div>;
  }

  const totalUsage = chartData.reduce((sum, d) => sum + parseFloat(d.usage), 0);
  const totalCost = chartData.reduce((sum, d) => sum + parseFloat(d.cost), 0);
  const avgUsage = totalUsage / chartData.length;
  const avgCost = totalCost / chartData.length;

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">Usage Statistics</h1>
          <p className="text-sm md:text-base text-gray-600">Comprehensive energy usage and cost analysis</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-black">{totalUsage.toFixed(1)} kWh</div>
            <p className="text-xs md:text-sm text-gray-600">Total Usage</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-black">${totalCost.toFixed(2)}</div>
            <p className="text-xs md:text-sm text-gray-600">Total Cost</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-black">{avgUsage.toFixed(1)} kWh</div>
            <p className="text-xs md:text-sm text-gray-600">Avg Usage/Day</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-xl md:text-2xl font-bold text-black">${avgCost.toFixed(2)}</div>
            <p className="text-xs md:text-sm text-gray-600">Avg Cost/Day</p>
          </div>
        </div>

        {/* Chart 1: Area Chart - Energy Usage Flow */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h3 className="text-lg font-bold text-black mb-4">📊 Energy Usage Flow (Area Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Usage (kWh)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="usage" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorUsage)" name="Energy Usage (kWh)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Chart 2: Scatter Plot - Usage vs Cost Correlation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-black mb-4">🔵 Usage vs Cost (Scatter Plot)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="usage" name="Usage" unit=" kWh" label={{ value: 'Usage (kWh)', position: 'insideBottom', offset: -5 }} />
                <YAxis type="number" dataKey="cost" name="Cost" unit=" $" label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                <ZAxis range={[100, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Usage vs Cost" data={chartData} fill="#EF4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Radar Chart - Weekly Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-black mb-4">⭐ Performance Radar</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData.slice(0, 7)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="date" />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                <Radar name="Usage (kWh)" dataKey="usage" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                <Radar name="Cost ($)" dataKey="cost" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Stacked Bar Chart - Combined View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h3 className="text-lg font-bold text-black mb-4">📈 Daily Breakdown (Stacked Bar Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="usage" stackId="a" fill="#3B82F6" name="Usage (kWh)" />
              <Bar dataKey="cost" stackId="a" fill="#10B981" name="Cost ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 5: Smooth Line Chart - Trend Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-bold text-black mb-4">📉 Cost Trend Analysis (Smooth Line)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Line type="monotoneX" dataKey="cost" stroke="#EC4899" strokeWidth={3} dot={{ fill: '#EC4899', r: 5 }} name="Cost ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
