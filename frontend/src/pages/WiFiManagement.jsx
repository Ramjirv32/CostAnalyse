import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Cpu,
  Power,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Signal,
  Zap,
  Activity,
  Plus,
  BarChart3
} from 'lucide-react';
import { usePreferences } from '../contexts/PreferencesContext';

export default function WiFiManagement({ user, onBack }) {
  const { formatPower, formatCurrency, preferences, loading: prefsLoading } = usePreferences();
  const [esp32Controllers, setEsp32Controllers] = useState([]);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [wifiEnergyDevices, setWifiEnergyDevices] = useState([]);
  const [wifiEnergyAnalytics, setWifiEnergyAnalytics] = useState([]);
  const [expandedESP32, setExpandedESP32] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

    // Fetch ESP32 controllers
  const fetchESP32Controllers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/esp32', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch ESP32 controllers');

      const data = await response.json();
      console.log('ESP32 Controllers Response:', data); // Debug log
      if (data.success) {
        setEsp32Controllers(data.data || []);
        console.log('ESP32 Controllers Set:', data.data); // Debug log
      }
    } catch (error) {
      console.error('Error fetching ESP32 controllers:', error);
      setError(error.message);
    }
  };

  // Fetch all WiFi devices
  const fetchWiFiDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch WiFi devices');

      const data = await response.json();
      console.log('WiFi Devices Response:', data); // Debug log
      if (data.success) {
        setWifiDevices(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching WiFi devices:', error);
      setError(error.message);
    }
  };

  // Fetch WiFi Energy Devices
  const fetchWiFiEnergyDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi-energy/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWifiEnergyDevices(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching WiFi energy devices:', error);
    }
  };

  // Fetch WiFi Energy Analytics
  const fetchWiFiEnergyAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi-energy/analytics/latest', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWifiEnergyAnalytics(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching WiFi energy analytics:', error);
    }
  };

  // Setup demo devices
  const setupDemo = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/setup-demo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to setup demo devices');

      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        await fetchESP32Controllers();
        await fetchWiFiDevices();
      }
    } catch (error) {
      console.error('Error setting up demo:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Disconnect device from ESP32
  const disconnectDevice = async (wifiDeviceId) => {
    if (!confirm('Are you sure you want to disconnect this device?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi/devices/${wifiDeviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to disconnect device');

      const data = await response.json();
      if (data.success) {
        setSuccess('Device disconnected successfully');
        await fetchWiFiDevices();
        await fetchESP32Controllers();
      }
    } catch (error) {
      console.error('Error disconnecting device:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update device name
  const updateDeviceName = async (deviceId, newName) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) throw new Error('Failed to update device name');

      const data = await response.json();
      if (data.success) {
        setSuccess('Device renamed successfully');
        setEditingDevice(null);
        setEditName('');
        await fetchWiFiDevices();
      }
    } catch (error) {
      console.error('Error updating device name:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get devices for an ESP32
  const getDevicesForESP32 = (esp32Id) => {
    return wifiDevices.filter(wd => {
      // Handle both populated and non-populated esp32Id
      const deviceEsp32Id = wd.esp32?._id || wd.esp32Id?._id || wd.esp32Id;
      return deviceEsp32Id === esp32Id || deviceEsp32Id?.toString() === esp32Id?.toString();
    });
  };

  // Get signal strength display
  const getSignalDisplay = (strength) => {
    if (strength >= -50) return { text: 'Excellent', color: 'text-green-600', bars: 4 };
    if (strength >= -60) return { text: 'Good', color: 'text-green-500', bars: 3 };
    if (strength >= -70) return { text: 'Fair', color: 'text-yellow-600', bars: 2 };
    return { text: 'Poor', color: 'text-red-600', bars: 1 };
  };

  useEffect(() => {
    fetchESP32Controllers();
    fetchWiFiDevices();
    fetchWiFiEnergyDevices();
    fetchWiFiEnergyAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchWiFiEnergyAnalytics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Count connected devices
  const connectedCount = wifiDevices.filter(d => d.connectionStatus === 'connected').length;
  const pendingCount = wifiDevices.filter(d => d.connectionStatus === 'pending_approval').length;

  // Show loading while preferences are being fetched
  if (prefsLoading || !preferences?.currencyPreferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Wifi className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-xl text-gray-600">Loading WiFi management and preferences...</p>
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
              <button
                onClick={onBack}
                className="px-4 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors rounded-lg"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold">WiFi Device Management</h1>
                <p className="text-gray-300 mt-1">Manage ESP32 controllers and connected devices</p>
                {/* Display active preferences */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full font-semibold">
                    💰 {preferences.currencyPreferences.currencySymbol} {preferences.currencyPreferences.currency} - {preferences.currencyPreferences.country}
                  </span>
                  <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full font-semibold">
                    ⚡ Rate: {preferences.currencyPreferences.currencySymbol}{preferences.currencyPreferences.electricityRate}/kWh
                  </span>
                  <span className="text-xs px-2 py-1 bg-purple-500 text-white rounded-full font-semibold">
                    🔌 Power: {preferences.displayPreferences.powerUnit === 'watts' ? 'Watts' : 'Kilowatts'}
                  </span>
                  <span className="text-xs px-2 py-1 bg-orange-500 text-white rounded-full font-semibold">
                    📊 Energy: {preferences.displayPreferences.energyUnit}
                  </span>
                </div>
              </div>
            </div>
            <Wifi className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="bg-red-50 border-l-4 border-red-500 text-red-900 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5" />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="bg-green-50 border-l-4 border-green-500 text-green-900 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">{success}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto mt-6 px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-black rounded-lg">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">ESP32 Controllers</p>
                <p className="text-2xl font-bold text-black">{esp32Controllers.length}</p>
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
                <p className="text-2xl font-bold text-black">{connectedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Approval</p>
                <p className="text-2xl font-bold text-black">{pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={setupDemo}
              disabled={loading}
              className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-8 h-8 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-bold">Setup Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ESP32 Controllers with Devices */}
      <div className="max-w-7xl mx-auto mt-6 px-6 pb-12">
        {esp32Controllers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-black mb-2">No ESP32 Controllers Found</h3>
            <p className="text-gray-600 mb-6">Click "Setup Demo" to create demo ESP32 controllers with devices</p>
            <button
              onClick={setupDemo}
              disabled={loading}
              className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Setup Demo Devices'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {esp32Controllers.map((esp32) => {
              const esp32Devices = getDevicesForESP32(esp32._id);
              const isExpanded = expandedESP32 === esp32._id;
              const signalDisplay = getSignalDisplay(esp32.signalStrength || -60);

              return (
                <div key={esp32._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* ESP32 Header */}
                  <div
                    className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                    onClick={() => setExpandedESP32(isExpanded ? null : esp32._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-black rounded-lg">
                          <Cpu className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-black">{esp32.name}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Signal className="w-4 h-4" />
                              <span className={signalDisplay.color + ' font-semibold'}>
                                {signalDisplay.text}
                              </span>
                            </span>
                            <span>📍 {esp32.location || 'Unknown'}</span>
                            <span>🌐 {esp32.ipAddress}</span>
                            <span>📶 {esp32.wifiSSID}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Connected Devices</p>
                          <p className="text-2xl font-bold text-black">{esp32Devices.length}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          esp32.status === 'online'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {(esp32.status || 'offline').toUpperCase()}
                        </span>
                        <button className="p-2 hover:bg-white rounded-lg transition-colors">
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Connected Devices */}
                  {isExpanded && (
                    <div className="p-6">
                      {esp32Devices.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="font-semibold">No devices connected to this ESP32</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {esp32Devices.map((wifiDevice) => {
                            const device = wifiDevice.device;
                            const isEditing = editingDevice === device?._id;

                            return (
                              <div key={wifiDevice._id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-3 rounded-lg ${
                                      wifiDevice.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-300'
                                    }`}>
                                      <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      {isEditing ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black flex-1"
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => updateDeviceName(device._id, editName)}
                                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingDevice(null);
                                              setEditName('');
                                            }}
                                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <h4 className="font-bold text-lg text-black">{device?.name || 'Unknown Device'}</h4>
                                      )}
                                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                        <span>⚡ {device?.powerRating || 0}W</span>
                                        <span>🔌 {wifiDevice.deviceIP}</span>
                                        <span>📱 {wifiDevice.deviceMAC}</span>
                                        <span className={`font-semibold ${
                                          wifiDevice.connectionStatus === 'connected' ? 'text-green-600' : 'text-gray-600'
                                        }`}>
                                          {wifiDevice.connectionStatus.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {!isEditing && (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditingDevice(device._id);
                                            setEditName(device.name);
                                          }}
                                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                          title="Rename device"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => disconnectDevice(wifiDevice._id)}
                                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                          title="Disconnect device"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WiFi Energy Analytics Section */}
      {wifiEnergyAnalytics.length > 0 && (
        <div className="max-w-7xl mx-auto mt-6 px-6 pb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-black">WiFi Energy Monitoring</h2>
                    <p className="text-gray-600 mt-1">Real-time energy consumption for connected WiFi devices</p>
                  </div>
                </div>
                <span className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-bold">
                  {wifiEnergyAnalytics.length} Active
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Device</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">ESP32 Controller</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Power</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Voltage</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Current</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Hour</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost/Day</th>
                  </tr>
                </thead>
                <tbody>
                  {wifiEnergyAnalytics.map((item, index) => (
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
                      <td className="py-3 px-4 text-right font-mono font-semibold text-black">
                        {formatPower(item.currentPower)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">
                        {item.voltage.toFixed(1)}V
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600">
                        {item.current.toFixed(2)}A
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-green-600 font-semibold">
                        {formatCurrency(item.costPerHour)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600 font-semibold">
                        {formatCurrency(item.costPerDay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
