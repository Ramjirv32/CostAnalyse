import { useState, useEffect } from 'react';
import {
  Plus,
  Power,
  Zap,
  TrendingUp,
  Settings as SettingsIcon,
  Settings,
  LogOut,
  Thermometer,
  Lightbulb,
  Fan,
  Tv,
  DollarSign,
  Activity,
  Trash2,
  Edit3,
  Wifi,
  Home,
  BarChart3,
  ListTodo,
  Trophy,
  MessageSquare,
  Bell,
  HelpCircle,
  ChevronLeft,
  RefreshCw,
  FileText
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Import page components
import Analytics from './Analytics';
import Statistics from './Statistics';
import Reports from './Reports';
import Notifications from './Notifications';
import HelpSupport from './HelpSupport';
import WiFiManagement from './WiFiManagement';
// import Settings from './Settings';
import CurrencySelection from '../components/CurrencySelection';

const deviceIcons = {
  light: Lightbulb,
  fan: Fan,
  ac: Thermometer,
  tv: Tv,
  other: Zap
};

export default function Dashboard({ user, onLogout, onNavigateToWiFi, onNavigateToSettings }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [timeFilter, setTimeFilter] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [energyFlow, setEnergyFlow] = useState(0); // Real-time energy flow
  const [devices, setDevices] = useState([]);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [wifiStats, setWifiStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', power: '', description: '' });
  
  // Real-time energy tracking per device
  const [deviceEnergyFlow, setDeviceEnergyFlow] = useState({});
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [energySummary, setEnergySummary] = useState(null);

  // Currency preferences
  const [currencyPrefs, setCurrencyPrefs] = useState(null);
  const [showCurrencySelection, setShowCurrencySelection] = useState(false);

  // Setup demo devices automatically
  const setupDemoDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/devices/setup-demo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Demo devices setup:', data.message);
          return data.data;
        }
      }
    } catch (error) {
      console.error('Error setting up demo devices:', error);
    }
    return null;
  };

  // Fetch devices from backend
  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // If no devices, auto-create demo devices
        if (data.data.length === 0) {
          console.log('📦 No devices found, creating demo devices...');
          const demoDevices = await setupDemoDevices();
          if (demoDevices) {
            setDevices(demoDevices);
          }
        } else {
          setDevices(data.data);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch devices');
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch WiFi devices
  const fetchWiFiDevices = async () => {
    try {
      const token = localStorage.getItem('token');

      const [devicesRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/api/wifi/devices', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('http://localhost:5000/api/wifi/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        if (devicesData.success) {
          setWifiDevices(devicesData.data);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setWifiStats(statsData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching WiFi devices:', error);
    }
  };

  // Fetch real-time energy data from backend (stored estimates)
  const fetchRealtimeEnergy = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/energy/realtime', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.devices) {
          setRealtimeStats(data.data);
          
          // Update deviceEnergyFlow with stored data
          const flowData = {};
          data.data.devices.forEach(estimate => {
            flowData[estimate.deviceId] = {
              deviceId: estimate.deviceId,
              deviceName: estimate.deviceName,
              deviceType: estimate.deviceType,
              currentPower: estimate.currentPower,
              powerRating: estimate.powerRating,
              voltage: estimate.voltage,
              current: estimate.current,
              frequency: estimate.frequency,
              status: estimate.status,
              costPerSecond: estimate.costPerSecond,
              costPerHour: estimate.costPerHour,
              costPerDay: estimate.costPerDay
            };
          });
          setDeviceEnergyFlow(flowData);
          
          // Update total energy flow
          const totalPower = data.data.devices.reduce((sum, d) => sum + d.currentPower, 0);
          setEnergyFlow(totalPower);
        }
      }
    } catch (error) {
      console.error('Error fetching realtime energy:', error);
    }
  };

  // Fetch energy summary
  const fetchEnergySummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/energy/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEnergySummary(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching energy summary:', error);
    }
  };

  // Fetch currency preferences
  const fetchCurrencyPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/currency', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrencyPrefs(data.data);
          
          // Show currency selection modal if it's the user's first time
          if (!data.data.currency || data.data.currency === 'USD') {
            // Only show if user hasn't explicitly set preferences
            const hasSetPrefs = localStorage.getItem('currencyPrefsSet');
            if (!hasSetPrefs) {
              setShowCurrencySelection(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching currency preferences:', error);
    }
  };

  // Handle currency preference update
  const handleCurrencyUpdate = (newPrefs) => {
    if (newPrefs) {
      setCurrencyPrefs(newPrefs);
      localStorage.setItem('currencyPrefsSet', 'true');
    }
    setShowCurrencySelection(false);
  };

  // Format currency based on user preferences
  const formatCurrency = (amount, decimals = 2) => {
    if (!currencyPrefs) return `$${amount.toFixed(decimals)}`;
    
    const symbol = currencyPrefs.currencySymbol || '$';
    const convertedAmount = amount * (currencyPrefs.conversionRates?.[currencyPrefs.currency] || 1);
    
    return `${symbol}${convertedAmount.toFixed(decimals)}`;
  };

  // Save energy estimate to backend
  const saveEnergyEstimate = async (deviceId, deviceName, deviceType, currentPower, status) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/energy/estimate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId,
          deviceName,
          deviceType,
          currentPower,
          status
        })
      });
    } catch (error) {
      console.error('Error saving energy estimate:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchWiFiDevices();
    fetchEnergySummary();
    fetchChartData();
    fetchRealtimeEnergy(); // Fetch stored energy data
    fetchCurrencyPreferences(); // Fetch user's currency preferences
    
    // Refresh data periodically
    const wifiInterval = setInterval(fetchWiFiDevices, 30000);
    const summaryInterval = setInterval(fetchEnergySummary, 60000);
    const chartInterval = setInterval(fetchChartData, 120000);
    const realtimeInterval = setInterval(fetchRealtimeEnergy, 5000); // Every 5 seconds
    
    return () => {
      clearInterval(wifiInterval);
      clearInterval(summaryInterval);
      clearInterval(chartInterval);
      clearInterval(realtimeInterval);
    };
  }, []);

  // Fetch chart data when time filter changes
  useEffect(() => {
    fetchChartData();
  }, [timeFilter]);

  // Note: Real-time data now comes from backend simulator
  // Data is fetched every 5 seconds from /api/energy/realtime
  // Backend simulator generates data every 10 seconds with realistic patterns

  const addDevice = async () => {
    if (!newDevice.name || !newDevice.power) {
      setError('Device name and power rating are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/devices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newDevice.name,
          powerRating: parseInt(newDevice.power),
          description: newDevice.description || '',
          type: 'other' // Default type, can be changed later
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setDevices([...devices, data.data]);
        setNewDevice({ name: '', power: '', description: '' });
        setShowAddDevice(false);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to add device');
      }
    } catch (error) {
      console.error('Error adding device:', error);
      setError(error.message);
    }
  };

  const toggleDevice = async (id) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/devices/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setDevices(devices.map(device =>
          device._id === id
            ? { ...device, status: data.data.status }
            : device
        ));
      } else {
        throw new Error(data.error || 'Failed to toggle device');
      }
    } catch (error) {
      console.error('Error toggling device:', error);
      setError(error.message);
    }
  };

  const deleteDevice = async (id) => {
    if (!confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:5000/api/devices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setDevices(devices.filter(device => device._id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete device');
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      setError(error.message);
    }
  };

  // Use real-time energy flow for total power
  const totalPower = energyFlow; // This is updated every second
  
  const activeDevices = devices.filter(d => d.status === 'online').length + (wifiStats?.online || 0);
  
  // Calculate total costs
  const wifiDailyCost = wifiStats?.power?.dailyCost || 0;
  const wifiWeeklyCost = wifiStats?.power?.weeklyCost || 0;
  const wifiMonthlyCost = wifiStats?.power?.monthlyCost || 0;

  // Chart data state
  const [chartData, setChartData] = useState([]);

  // Fetch chart data from backend
  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem('token');
      const days = timeFilter === 'daily' ? 7 : timeFilter === 'weekly' ? 28 : 90;
      
      const response = await fetch(`http://localhost:5000/api/energy/charts?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          // Format data for charts
          const formatted = data.data.map((item, index) => {
            const date = new Date(item.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            return {
              day: dayName,
              usage: parseFloat(item.usage),
              cost: parseFloat(item.cost)
            };
          });
          setChartData(formatted);
        }
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  // Fallback sample data if no real data available
  const usageData = chartData.length > 0 ? chartData : [
    { day: 'Mon', usage: 12.5, cost: 2.5 },
    { day: 'Tue', usage: 15.2, cost: 3.04 },
    { day: 'Wed', usage: 10.8, cost: 2.16 },
    { day: 'Thu', usage: 18.3, cost: 3.66 },
    { day: 'Fri', usage: 14.7, cost: 2.94 },
    { day: 'Sat', usage: 20.1, cost: 4.02 },
    { day: 'Sun', usage: 16.9, cost: 3.38 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black font-semibold text-lg">Loading your activity insights...</p>
        </div>
      </div>
    );
  }

  const totalWifiDevices = wifiDevices.length;
  const activeDevicesCount = devices.filter(d => d.status === 'online').length + (wifiStats?.online || 0);
  const totalDevicesCount = devices.length + totalWifiDevices;

  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', sublabel: 'Overview', badge: null },
    { id: 'analytics', icon: BarChart3, label: 'Energy Analytics', sublabel: 'Detailed Reports', badge: null },
    { id: 'statistics', icon: Activity, label: 'Statistics', sublabel: 'Usage Statistics', badge: `${(energyFlow / 1000).toFixed(1)}kW` },
    { id: 'reports', icon: FileText, label: 'Reports', sublabel: 'Download Reports', badge: null },
    { id: 'wifi', icon: Wifi, label: 'WiFi Devices', sublabel: 'ESP32 & WiFi', badge: totalWifiDevices > 0 ? `${totalWifiDevices}` : null },
    { id: 'currency', icon: DollarSign, label: 'Currency Settings', sublabel: currencyPrefs ? `${currencyPrefs.currencySymbol} ${currencyPrefs.currency}` : 'Set Currency', badge: null },
    { id: 'notifications', icon: Bell, label: 'Notifications', sublabel: 'Alerts & Updates', badge: null },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', sublabel: 'Get Help', badge: null },
    { id: 'settings', icon: SettingsIcon, label: 'Settings', sublabel: 'App Settings', badge: null },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-black">PowerAI</h1>
            <p className="text-xs text-gray-500">Energy Hub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">
                {user?.name?.charAt(0).toUpperCase() || 'P'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-black">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {/* Render different pages based on activeView */}
        {activeView === 'analytics' && <Analytics />}
        {activeView === 'statistics' && <Statistics />}
        {activeView === 'reports' && <Reports />}
        {activeView === 'wifi-management' && <WiFiManagement user={user} />}
        {activeView === 'currency' && <CurrencySelection user={user} onUpdate={handleCurrencyUpdate} />}
        {activeView === 'notifications' && <Notifications user={user} />}
        {activeView === 'help' && <HelpSupport />}
        {activeView === 'settings' && <Settings user={user} />}
        {activeView === 'wifi' && <WiFiManagement user={user} onBack={() => setActiveView('dashboard')} />}
        
        {/* Dashboard View (default) */}
        {(activeView === 'dashboard' || activeView === 'devices') && (
          <>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-black">Energy Activity Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Track and analyze your energy consumption patterns</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    fetchDevices();
                    fetchWiFiDevices();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Sync Energy Data</span>
                </button>
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setTimeFilter('daily')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      timeFilter === 'daily'
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setTimeFilter('weekly')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      timeFilter === 'weekly'
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeFilter('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      timeFilter === 'monthly'
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="px-8 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Real-time Energy Flow Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-black">Real-time Energy Flow</h2>
                <p className="text-sm text-gray-600 mt-1">Live power consumption monitoring</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-700">Live</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-black opacity-5 rounded-full animate-ping"></div>
                  <div className="relative bg-gradient-to-br from-black to-gray-800 text-white rounded-full w-48 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                      <div className="text-4xl font-bold">{(energyFlow / 1000).toFixed(3)}</div>
                      <div className="text-sm font-medium opacity-80">kW</div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 mt-6 text-sm">
                  Energy flow updates every second
                </p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-black rounded-lg">
                  <Power className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-black mb-1">{activeDevices}</div>
              <h3 className="text-sm font-semibold text-gray-700">Active Devices</h3>
              <p className="text-xs text-gray-500 mt-1">
                {activeDevices} online / {devices.length} total
                {activeDevices === 0 && devices.length > 0 && (
                  <span className="block text-orange-600 font-semibold mt-1">⚠️ Turn devices ON</span>
                )}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-black rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-black mb-1">{(totalPower / 1000).toFixed(2)} kW</div>
              <h3 className="text-sm font-semibold text-gray-700">Current Power</h3>
              <p className="text-xs text-gray-500 mt-1">Total consumption</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-black rounded-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-black mb-1">${wifiDailyCost.toFixed(2)}</div>
              <h3 className="text-sm font-semibold text-gray-700">
                {timeFilter === 'daily' ? "Today's Cost" : timeFilter === 'weekly' ? "Weekly Cost" : "Monthly Cost"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">@ $0.20/kWh</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-black rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-black mb-1">
                {timeFilter === 'daily' ? wifiStats?.power?.dailyUsage.toFixed(1) || '0.0' : 
                 timeFilter === 'weekly' ? wifiStats?.power?.weeklyUsage.toFixed(1) || '0.0' :
                 wifiStats?.power?.monthlyUsage.toFixed(1) || '0.0'} kWh
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Energy Usage</h3>
              <p className="text-xs text-gray-500 mt-1">
                {timeFilter === 'daily' ? 'Today' : timeFilter === 'weekly' ? 'This week' : 'This month'}
              </p>
            </div>
          </div>

          {/* Charts Section */}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Usage Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-black">Power Usage</h2>
                  <p className="text-sm text-gray-600">
                    {timeFilter === 'daily' ? 'Last 7 days' : timeFilter === 'weekly' ? 'Last 4 weeks' : 'Last 12 months'}
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="day" stroke="#666" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#000"
                    strokeWidth={2}
                    dot={{ fill: '#000', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cost Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-black">Energy Cost</h2>
                  <p className="text-sm text-gray-600">
                    {timeFilter === 'daily' ? 'Last 7 days' : timeFilter === 'weekly' ? 'Last 4 weeks' : 'Last 12 months'}
                  </p>
                </div>
                <DollarSign className="w-5 h-5 text-gray-600" />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="day" stroke="#666" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="cost" fill="#000" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Devices Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-black">My Devices</h2>
                  <p className="text-sm text-gray-600">Manage your IoT devices</p>
                </div>
                <button
                  onClick={() => setShowAddDevice(!showAddDevice)}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add Device
                </button>
              </div>
            </div>

            {/* Add Device Form */}
            {showAddDevice && (
              <div className="p-6 bg-white border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Device Name (e.g., Living Room Light)"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white text-black placeholder-gray-400"
                  />
                  <input
                    type="number"
                    placeholder="Power Rating (Watts)"
                    value={newDevice.power}
                    onChange={(e) => setNewDevice({ ...newDevice, power: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white text-black placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newDevice.description}
                    onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white text-black placeholder-gray-400"
                  />
                  <div className="flex gap-2 md:col-span-3">
                    <button
                      onClick={addDevice}
                      className="flex-1 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                    >
                      Add Device
                    </button>
                    <button
                      onClick={() => {
                        setShowAddDevice(false);
                        setNewDevice({ name: '', power: '', description: '' });
                        setError(null);
                      }}
                      className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Device List */}
            <div className="divide-y divide-gray-200">
              {devices.length === 0 ? (
                <div className="p-12 text-center">
                  <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-black font-semibold">No devices added yet</p>
                  <p className="text-sm text-gray-500">Click "Add Device" to get started</p>
                </div>
              ) : (
                devices.map((device) => {
                  const Icon = deviceIcons[device.type] || Zap;
                  const deviceFlow = deviceEnergyFlow[device._id];
                  const currentPower = deviceFlow?.currentPower || 0;
                  const costPerSecond = deviceFlow?.costPerSecond || 0;
                  const costPerHour = deviceFlow?.costPerHour || 0;
                  const costPerDay = deviceFlow?.costPerDay || 0;
                  
                  return (
                    <div
                      key={device._id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-3 rounded-lg ${
                            device.status === 'online' ? 'bg-black' : 'bg-gray-200'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              device.status === 'online' ? 'text-white' : 'text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-black text-lg">{device.name}</h3>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-sm text-gray-600 font-medium">
                                Rated: {device.powerRating}W
                                {device.description && ` • ${device.description}`}
                              </span>
                              {device.esp32Id && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-300 font-semibold">
                                  📡 {device.esp32Id.name || 'ESP32'}
                                </span>
                              )}
                              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                device.status === 'online'
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {(device.status || 'unknown').toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Real-time Energy Flow Display */}
                            {device.status === 'online' && deviceFlow && (
                              <div className="mt-3 space-y-3">
                                <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <p className="text-xs text-gray-600 font-medium">Current Power</p>
                                      <p className="text-lg font-bold text-black tabular-nums">
                                        {currentPower.toFixed(2)} <span className="text-sm">W</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 font-medium">Cost/Second</p>
                                      <p className="text-lg font-bold text-green-700 tabular-nums">
                                        ${(costPerSecond * 1000).toFixed(4)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 font-medium">Cost/Hour</p>
                                      <p className="text-lg font-bold text-blue-700 tabular-nums">
                                        {formatCurrency(costPerHour, 3)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 font-medium">Cost/Day</p>
                                      <p className="text-lg font-bold text-purple-700 tabular-nums">
                                        {formatCurrency(costPerDay, 2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Voltage & Current Flow - FROM BACKEND */}
                                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <p className="text-xs text-gray-600 font-medium">Voltage</p>
                                      <p className="text-lg font-bold text-orange-700 tabular-nums">
                                        {(deviceFlow.voltage || 220).toFixed(1)} <span className="text-sm">V</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 font-medium">Current</p>
                                      <p className="text-lg font-bold text-orange-700 tabular-nums">
                                        {(deviceFlow.current || 0).toFixed(2)} <span className="text-sm">A</span>
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 font-medium">Frequency</p>
                                      <p className="text-lg font-bold text-orange-700 tabular-nums">
                                        {(deviceFlow.frequency || 50).toFixed(1)} <span className="text-sm">Hz</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <button
                            onClick={() => toggleDevice(device._id)}
                            className={`p-3 rounded-lg transition-all ${
                              device.status === 'online'
                                ? 'bg-black hover:bg-gray-800'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            <Power className={`w-5 h-5 ${
                              device.status === 'online' ? 'text-white' : 'text-gray-600'
                            }`} />
                          </button>
                          <button
                            onClick={() => deleteDevice(device._id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* WiFi/ESP32 Devices Section */}
          {wifiDevices.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-black flex items-center gap-2">
                      <Wifi className="w-5 h-5" />
                      WiFi & ESP32 Devices
                    </h2>
                    <p className="text-sm text-gray-600">
                      {wifiStats?.esp32 || 0} ESP32 hubs • {wifiStats?.standalone || 0} standalone devices
                    </p>
                  </div>
                  <button
                    onClick={onNavigateToWiFi}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm"
                  >
                    Manage WiFi Devices
                  </button>
                </div>
              </div>

              {/* WiFi Device List */}
              <div className="divide-y divide-gray-200">
                {wifiDevices.map((device) => {
                  const currentPower = device.deviceMode === 'esp32' 
                    ? (device.esp32Config?.connectedDevices || []).reduce((sum, d) => 
                        d.state === 'on' ? sum + (d.currentPower || d.powerRating || 0) : sum, 0)
                    : (device.currentState?.power ? (device.standaloneConfig?.currentPower || device.standaloneConfig?.powerRating || 0) : 0);

                  return (
                    <div
                      key={device._id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${
                            device.status === 'online' ? 'bg-black' : 'bg-gray-200'
                          }`}>
                            <Wifi className={`w-6 h-6 ${
                              device.status === 'online' ? 'text-white' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-black text-lg">{device.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-gray-600 font-medium">
                                {device.ipAddress} • {currentPower}W
                              </span>
                              <span className="text-xs px-3 py-1 bg-black text-white rounded-full font-bold uppercase">
                                {device.deviceMode}
                              </span>
                              <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                                device.status === 'online'
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                {(device.status || 'unknown').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-black">${(device.todayCost || 0).toFixed(2)}</div>
                          <div className="text-xs text-gray-600">{(device.todayUsage || 0).toFixed(2)} kWh today</div>
                        </div>
                      </div>

                      {/* ESP32 Connected Devices */}
                      {device.deviceMode === 'esp32' && device.esp32Config?.connectedDevices && (
                        <div className="ml-14 mt-4 space-y-2">
                          <div className="text-xs font-bold text-gray-700 uppercase mb-2">Connected Devices:</div>
                          {device.esp32Config.connectedDevices.map((connectedDev, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  connectedDev.state === 'on' ? 'bg-green-500' : 'bg-gray-300'
                                }`}></div>
                                <div>
                                  <div className="font-bold text-sm text-black">{connectedDev.name}</div>
                                  <div className="text-xs text-gray-600">
                                    Pin {connectedDev.pin} • {connectedDev.deviceType} • {connectedDev.powerRating || 0}W
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${
                                  connectedDev.state === 'on'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-300 text-gray-700'
                                }`}>
                                  {connectedDev.state.toUpperCase()}
                                </span>
                                <span className="text-sm font-bold text-black">
                                  {connectedDev.currentPower || 0}W
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 overflow-x-auto">
        <div className="flex items-center justify-around px-2 py-3 min-w-max md:min-w-0">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'settings' && onNavigateToSettings) {
                    onNavigateToSettings();
                  } else {
                    setActiveView(item.id);
                  }
                }}
                className="relative flex flex-col items-center justify-center min-w-[60px] py-2 transition-all"
                title={item.label}
              >
                <div className={`relative p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-black' 
                    : 'hover:bg-gray-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isActive ? 'text-white' : 'text-gray-600'
                  }`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Currency Selection Modal */}
      {showCurrencySelection && (
        <CurrencySelection
          user={user}
          onUpdate={handleCurrencyUpdate}
          showInModal={true}
        />
      )}
    </div>
  );
}
