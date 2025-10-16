import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Power, Trash2, RefreshCw, Activity, Signal, Link, Unlink, Users, CheckCircle, XCircle } from 'lucide-react';

export default function WiFiDevicesNew({ user, onBack }) {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDevices();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchDevices();
      fetchStats();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDevices(data.data);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching WiFi devices:', error);
      setError('Failed to fetch devices');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleDevice = async (deviceId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
      
      const response = await fetch(`http://localhost:5000/api/wifi/devices/${deviceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchDevices();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling device:', error);
    }
  };

  const disconnectDevice = async (deviceId) => {
    if (!confirm('Disconnect this device? It will stop receiving data.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi/devices/${deviceId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchDevices();
        fetchStats();
      }
    } catch (error) {
      console.error('Error disconnecting device:', error);
    }
  };

  const deleteDevice = async (deviceId) => {
    if (!confirm('Delete this device permanently?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchDevices();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading WiFi devices...</div>;
  }

  const connectedCount = devices.filter(d => d.status === 'connected').length;
  const activeCount = devices.filter(d => d.isActive).length;

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-black">WiFi Devices</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your connected WiFi and ESP32 devices</p>
            </div>
            <button
              onClick={fetchDevices}
              className="p-2 md:p-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black">{devices.length}</div>
            <p className="text-xs md:text-sm text-gray-600">Total Devices</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black">{connectedCount}</div>
            <p className="text-xs md:text-sm text-gray-600">Connected</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black">{activeCount}</div>
            <p className="text-xs md:text-sm text-gray-600">Active</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Signal className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-black">
              {stats?.power?.currentPower?.toFixed(0) || 0}W
            </div>
            <p className="text-xs md:text-sm text-gray-600">Total Power</p>
          </div>
        </div>

        {/* Devices List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-black">Connected Devices</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {devices.length === 0 ? (
              <div className="p-8 md:p-12 text-center">
                <WifiOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-black font-semibold">No WiFi devices found</p>
                <p className="text-sm text-gray-500">Add ESP32 or WiFi devices to get started</p>
              </div>
            ) : (
              devices.map((device) => (
                <div key={device._id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Device Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-lg ${
                        device.status === 'connected' ? 'bg-green-100' : 'bg-gray-200'
                      }`}>
                        {device.status === 'connected' ? (
                          <Wifi className="w-6 h-6 text-green-600" />
                        ) : (
                          <WifiOff className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-black text-base md:text-lg truncate">{device.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs md:text-sm text-gray-600">
                            {device.macAddress || 'N/A'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            device.status === 'connected'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {device.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                            device.isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {device.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        
                        {/* Device Details */}
                        <div className="mt-2 text-xs md:text-sm text-gray-500">
                          <p>Type: {device.deviceType || 'WiFi Device'}</p>
                          {device.ipAddress && <p>IP: {device.ipAddress}</p>}
                          {device.signalStrength && <p>Signal: {device.signalStrength}%</p>}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <button
                        onClick={() => toggleDevice(device._id, device.status)}
                        className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          device.status === 'connected'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={device.status === 'connected' ? 'Disconnect' : 'Connect'}
                      >
                        <Link className="w-4 h-4 inline mr-1" />
                        {device.status === 'connected' ? 'Connected' : 'Connect'}
                      </button>

                      <button
                        onClick={() => disconnectDevice(device._id)}
                        className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-semibold"
                        title="Stop Data"
                      >
                        <Unlink className="w-4 h-4 inline mr-1" />
                        Stop Data
                      </button>

                      <button
                        onClick={() => deleteDevice(device._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Connection Info */}
        {stats && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-4 md:p-6">
            <h3 className="font-bold text-black mb-3">Network Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
              <div>
                <p className="text-gray-600">Online Devices</p>
                <p className="text-lg md:text-xl font-bold text-black">{stats.online || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Power</p>
                <p className="text-lg md:text-xl font-bold text-black">{stats.power?.currentPower?.toFixed(1) || 0}W</p>
              </div>
              <div>
                <p className="text-gray-600">Daily Cost</p>
                <p className="text-lg md:text-xl font-bold text-black">${stats.power?.dailyCost?.toFixed(2) || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Monthly Cost</p>
                <p className="text-lg md:text-xl font-bold text-black">${stats.power?.monthlyCost?.toFixed(2) || 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
