import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Search,
  Plus,
  Power,
  Settings,
  Trash2,
  RefreshCw,
  Radio,
  Cpu,
  Activity,
  ChevronRight,
  ChevronDown,
  Zap,
  Signal,
  Link,
  Unlink,
  Shield,
  ShieldOff,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Router,
  Smartphone,
  Lightbulb,
  Camera,
  Speaker,
  Thermometer,
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle,
  Info,
  Radar
} from 'lucide-react';
import WiFiScanner from './WiFiScanner';

export default function WiFiDevices({ user, onBack }) {
  const [activeTab, setActiveTab] = useState('scan'); // scan, devices, control
  const [scanning, setScanning] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [pairedDevices, setPairedDevices] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [expandedDevice, setExpandedDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Enhanced scanner state
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanMetadata, setScanMetadata] = useState(null);
  const [networkFilter, setNetworkFilter] = useState('all'); // all, secure, open, managed
  const [deviceFilter, setDeviceFilter] = useState('all'); // all, online, offline, esp32, router
  const [sortBy, setSortBy] = useState('signal'); // signal, name, security, devices
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [showWiFiScanner, setShowWiFiScanner] = useState(false);

  // Fetch paired devices
  const fetchPairedDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch devices');

      const data = await response.json();
      if (data.success) {
        setPairedDevices(data.data);
      }
    } catch (error) {
      console.error('Error fetching paired devices:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchPairedDevices();
  }, []);

  // Scan for WiFi networks
  const scanNetworks = async () => {
    setScanning(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/scan', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to scan networks');

      const data = await response.json();
      if (data.success) {
        setNetworks(data.data);
        setScanMetadata(data.metadata);
        setLastScanTime(new Date(data.scanTime));
        setSuccess(`Found ${data.count} networks`);
      }
    } catch (error) {
      console.error('Error scanning networks:', error);
      setError(error.message);
    } finally {
      setScanning(false);
    }
  };

  // Discover devices on network
  const discoverDevices = async (networkSSID = null) => {
    setDiscovering(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/discover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          networkSSID: networkSSID,
          scanAll: !networkSSID
        })
      });

      if (!response.ok) throw new Error('Failed to discover devices');

      const data = await response.json();
      if (data.success) {
        setDiscoveredDevices(data.data);
        setSuccess(`Discovered ${data.count} devices${networkSSID ? ` on ${networkSSID}` : ''}`);
      }
    } catch (error) {
      console.error('Error discovering devices:', error);
      setError(error.message);
    } finally {
      setDiscovering(false);
    }
  };

  // Pair with device
  const pairDevice = async (deviceInfo) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi/pair', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deviceInfo })
      });

      if (!response.ok) throw new Error('Failed to pair device');

      const data = await response.json();
      if (data.success) {
        setSuccess('Device paired successfully!');
        await fetchPairedDevices();
        setActiveTab('devices');
      }
    } catch (error) {
      console.error('Error pairing device:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Control device
  const controlDevice = async (deviceId, command, params) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi/devices/${deviceId}/control`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command, params })
      });

      if (!response.ok) throw new Error('Failed to control device');

      const data = await response.json();
      if (data.success) {
        setSuccess('Command executed successfully!');
        await fetchPairedDevices();
      }
    } catch (error) {
      console.error('Error controlling device:', error);
      setError(error.message);
    }
  };

  // Control ESP32 connected device
  const controlESP32Device = async (deviceId, pin, action, value = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi/devices/${deviceId}/esp32/control`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin, action, value })
      });

      if (!response.ok) throw new Error('Failed to control ESP32 device');

      const data = await response.json();
      if (data.success) {
        setSuccess('ESP32 command executed!');
        await fetchPairedDevices();
      }
    } catch (error) {
      console.error('Error controlling ESP32:', error);
      setError(error.message);
    }
  };

  // Delete device
  const deleteDevice = async (deviceId) => {
    if (!confirm('Are you sure you want to remove this device?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to delete device');

      const data = await response.json();
      if (data.success) {
        setSuccess('Device removed successfully!');
        await fetchPairedDevices();
      }
    } catch (error) {
      console.error('Error deleting device:', error);
      setError(error.message);
    }
  };

  // Get signal strength indicator
  const getSignalStrength = (strength) => {
    if (strength >= -50) return { bars: 4, quality: 'Excellent', color: 'black' };
    if (strength >= -60) return { bars: 3, quality: 'Good', color: 'black' };
    if (strength >= -70) return { bars: 2, quality: 'Fair', color: 'gray' };
    return { bars: 1, quality: 'Poor', color: 'gray' };
  };

  // Get device icon based on type
  const getDeviceIcon = (deviceType, deviceCategory) => {
    switch (deviceCategory?.toLowerCase()) {
      case 'lighting': return Lightbulb;
      case 'security': return Shield;
      case 'entertainment': return Speaker;
      case 'climate': return Thermometer;
      case 'sensor': return Radio;
      default:
        switch (deviceType?.toLowerCase()) {
          case 'esp32': return Cpu;
          case 'router': return Router;
          case 'smartphone': return Smartphone;
          case 'camera': return Camera;
          default: return Wifi;
        }
    }
  };

  // Filter networks based on current filter
  const getFilteredNetworks = () => {
    let filtered = [...networks];
    
    switch (networkFilter) {
      case 'secure':
        filtered = filtered.filter(n => n.security.length > 0);
        break;
      case 'open':
        filtered = filtered.filter(n => n.security.length === 0);
        break;
      case 'managed':
        filtered = filtered.filter(n => n.isManaged);
        break;
      default:
        break;
    }

    // Sort networks
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'signal':
          comparison = b.signalStrength - a.signalStrength;
          break;
        case 'name':
          comparison = a.ssid.localeCompare(b.ssid);
          break;
        case 'security':
          comparison = b.security.length - a.security.length;
          break;
        case 'devices':
          comparison = b.deviceCount - a.deviceCount;
          break;
        default:
          comparison = b.signalStrength - a.signalStrength;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return filtered;
  };

  // Filter discovered devices
  const getFilteredDevices = () => {
    let filtered = [...discoveredDevices];
    
    switch (deviceFilter) {
      case 'online':
        filtered = filtered.filter(d => d.isOnline);
        break;
      case 'offline':
        filtered = filtered.filter(d => !d.isOnline);
        break;
      case 'esp32':
        filtered = filtered.filter(d => d.type === 'sensor' || d.manufacturer === 'Espressif');
        break;
      case 'router':
        filtered = filtered.filter(d => d.type === 'router');
        break;
      default:
        break;
    }

    return filtered;
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        scanNetworks();
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-6 border-b-4 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold">WiFi Device Manager</h1>
                <p className="text-gray-300 mt-1">Detect, pair, and control WiFi devices</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowWiFiScanner(true)}
                className="p-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Scan Nearby WiFi Networks"
              >
                <Radar className="w-5 h-5" />
                <span className="text-sm font-medium">Scan</span>
              </button>
              <Wifi className="w-12 h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="bg-red-50 border-2 border-red-500 text-red-900 px-4 py-3 font-bold">
            ⚠ {error}
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="bg-green-50 border-2 border-green-500 text-green-900 px-4 py-3 font-bold">
            ✓ {success}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mt-6 px-6">
        <div className="flex gap-2 border-b-2 border-black">
          <button
            onClick={() => setActiveTab('scan')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'scan'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Search className="inline w-5 h-5 mr-2" />
            Scan & Discover
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-6 py-3 font-bold transition-colors ${
              activeTab === 'devices'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Wifi className="inline w-5 h-5 mr-2" />
            My Devices ({pairedDevices.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto mt-6 px-6 pb-12">
        {/* Scan & Discover Tab */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {/* Scan Networks Section */}
            <div className="border-4 border-black p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">WiFi Networks</h2>
                <button
                  onClick={scanNetworks}
                  disabled={scanning}
                  className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
                  {scanning ? 'Scanning...' : 'Scan Networks'}
                </button>
              </div>

              {networks.length > 0 ? (
                <div className="space-y-2">
                  {networks.map((network, index) => {
                    const signal = getSignalStrength(network.signalStrength);
                    return (
                      <div
                        key={index}
                        className="border-2 border-black p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedNetwork(network);
                          discoverDevices(network.ssid);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Signal className="w-6 h-6" />
                            <div>
                              <div className="font-bold text-lg">{network.ssid}</div>
                              <div className="text-sm text-gray-600">
                                {network.bssid} • Channel {network.channel} • {signal.quality}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {network.deviceType === 'esp32' && (
                              <span className="px-3 py-1 bg-black text-white text-sm font-bold">
                                ESP32
                              </span>
                            )}
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wifi className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-bold">No networks found. Click "Scan Networks" to start.</p>
                </div>
              )}
            </div>

            {/* Discover Devices Section */}
            <div className="border-4 border-black p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Discovered Devices</h2>
                <button
                  onClick={() => discoverDevices()}
                  disabled={discovering}
                  className="px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                >
                  <Search className={`w-5 h-5 ${discovering ? 'animate-pulse' : ''}`} />
                  {discovering ? 'Discovering...' : 'Discover All'}
                </button>
              </div>

              {discoveredDevices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discoveredDevices.map((device, index) => (
                    <div key={index} className="border-2 border-black p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {device.deviceMode === 'esp32' ? (
                            <Cpu className="w-8 h-8" />
                          ) : (
                            <Wifi className="w-8 h-8" />
                          )}
                          <div>
                            <div className="font-bold text-lg">{device.name}</div>
                            <div className="text-sm text-gray-600">{device.ssid}</div>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-black text-white text-xs font-bold uppercase">
                          {device.deviceMode}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">IP Address:</span>
                          <span className="font-bold">{device.ipAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">MAC Address:</span>
                          <span className="font-mono text-xs">{device.macAddress}</span>
                        </div>
                        {device.manufacturer && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Manufacturer:</span>
                            <span className="font-bold">{device.manufacturer}</span>
                          </div>
                        )}
                      </div>

                      {device.deviceMode === 'esp32' && device.connectedDevices && (
                        <div className="mb-4 p-3 bg-gray-50 border border-gray-300">
                          <div className="font-bold text-sm mb-2">Connected Devices:</div>
                          <div className="space-y-1 text-xs">
                            {device.connectedDevices.map((cd, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>Pin {cd.pin}: {cd.name}</span>
                                <span className="font-bold">{cd.deviceType}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => pairDevice(device)}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <Link className="w-4 h-4" />
                        {loading ? 'Pairing...' : 'Pair Device'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-bold">No devices discovered yet. Click "Discover All" to start.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Devices Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            {pairedDevices.length > 0 ? (
              pairedDevices.map((device) => (
                <div key={device._id} className="border-4 border-black">
                  {/* Device Header */}
                  <div
                    className="p-6 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setExpandedDevice(expandedDevice === device._id ? null : device._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {device.deviceMode === 'esp32' ? (
                          <Cpu className="w-10 h-10" />
                        ) : (
                          <Wifi className="w-10 h-10" />
                        )}
                        <div>
                          <div className="font-bold text-xl">{device.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                            <span>{device.ssid}</span>
                            <span>•</span>
                            <span>{device.ipAddress}</span>
                            <span>•</span>
                            <span className={`font-bold ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                              {device.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-black text-white text-sm font-bold uppercase">
                          {device.deviceMode}
                        </span>
                        {expandedDevice === device._id ? (
                          <ChevronDown className="w-6 h-6" />
                        ) : (
                          <ChevronRight className="w-6 h-6" />
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Expanded Device Controls */}
                  {expandedDevice === device._id && (
                    <div className="p-6 border-t-4 border-black">
                      {/* Standalone Device Controls */}
                      {device.deviceMode === 'standalone' && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-lg mb-4">Device Controls</h3>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => controlDevice(device._id, 'power_on', { power: true })}
                              className="px-6 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                              <Power className="w-5 h-5" />
                              Turn ON
                            </button>
                            <button
                              onClick={() => controlDevice(device._id, 'power_off', { power: false })}
                              className="px-6 py-4 bg-white text-black border-2 border-black font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                            >
                              <Power className="w-5 h-5" />
                              Turn OFF
                            </button>
                          </div>



                          {device.capabilities?.includes('dimmer') && (
                            <div>
                              <label className="block font-bold mb-2">Brightness</label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                defaultValue={device.currentState?.brightness || 50}
                                onChange={(e) => controlDevice(device._id, 'set_brightness', { brightness: parseInt(e.target.value) })}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* ESP32 Device Controls */}
                      {device.deviceMode === 'esp32' && device.esp32Config?.connectedDevices && (
                        <div className="space-y-4">
                          <h3 className="font-bold text-lg mb-4">Connected Devices</h3>
                          
                          {device.esp32Config.connectedDevices.map((connectedDev, idx) => (
                            <div key={idx} className="border-2 border-black p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="font-bold text-lg">{connectedDev.name}</div>
                                  <div className="text-sm text-gray-600">
                                    Pin {connectedDev.pin} • {connectedDev.deviceType}
                                  </div>
                                </div>
                                <span className={`px-3 py-1 text-sm font-bold ${
                                  connectedDev.state === 'on' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-300 text-black'
                                }`}>
                                  {connectedDev.state.toUpperCase()}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => controlESP32Device(device._id, connectedDev.pin, 'on')}
                                  className="px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                                >
                                  Turn ON
                                </button>
                                <button
                                  onClick={() => controlESP32Device(device._id, connectedDev.pin, 'off')}
                                  className="px-4 py-2 bg-white text-black border-2 border-black font-bold hover:bg-gray-100 transition-colors"
                                >
                                  Turn OFF
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Device Actions */}
                      <div className="mt-6 pt-6 border-t-2 border-gray-300 flex gap-3">
                        <button
                          onClick={() => deleteDevice(device._id)}
                          className="px-6 py-3 bg-red-600 text-white font-bold hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove Device
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-24 border-4 border-black">
                <WifiOff className="w-24 h-24 mx-auto mb-6 opacity-30" />
                <h3 className="text-2xl font-bold mb-2">No Paired Devices</h3>
                <p className="text-gray-600 mb-6">
                  Go to "Scan & Discover" tab to find and pair WiFi devices
                </p>
                <button
                  onClick={() => setActiveTab('scan')}
                  className="px-8 py-4 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
                >
                  Start Scanning
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* WiFi Scanner Modal/Overlay */}
      {showWiFiScanner && (
        <div className="fixed inset-0 bg-white z-50">
          <WiFiScanner 
            user={user} 
            onBack={() => setShowWiFiScanner(false)} 
          />
        </div>
      )}
    </div>
  );
}
