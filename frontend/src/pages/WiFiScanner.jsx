import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Search,
  RefreshCw,
  Signal,
  Shield,
  ShieldOff,
  Lock,
  Unlock,
  Router,
  Smartphone,
  Lightbulb,
  Camera,
  Speaker,
  Thermometer,
  Radio,
  Cpu,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

export default function WiFiScanner({ user, onBack }) {
  const [scanning, setScanning] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [networks, setNetworks] = useState([]);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanMetadata, setScanMetadata] = useState(null);
  const [networkFilter, setNetworkFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('signal');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

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

  // Get signal strength indicator
  const getSignalStrength = (strength) => {
    if (strength >= -50) return { bars: 4, quality: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (strength >= -60) return { bars: 3, quality: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (strength >= -70) return { bars: 2, quality: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { bars: 1, quality: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
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

  // Filter and sort networks
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
      }, 30000);
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

  const filteredNetworks = getFilteredNetworks();
  const filteredDevices = getFilteredDevices();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black text-white p-6 border-b-4 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-white text-black font-bold hover:bg-gray-200 transition-colors rounded"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold">📡 WiFi Network Scanner</h1>
                <p className="text-gray-300 mt-1">Discover nearby networks and devices like Ubuntu/Windows WiFi scanner</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lastScanTime && (
                <div className="text-right">
                  <div className="text-sm text-gray-300">Last scan:</div>
                  <div className="text-xs">{lastScanTime.toLocaleTimeString()}</div>
                </div>
              )}
              <Wifi className="w-12 h-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="bg-red-50 border-2 border-red-500 text-red-900 px-4 py-3 font-bold rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto mt-4 px-6">
          <div className="bg-green-50 border-2 border-green-500 text-green-900 px-4 py-3 font-bold rounded flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        </div>
      )}

      {/* Scanner Controls */}
      <div className="max-w-7xl mx-auto mt-6 px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={scanNetworks}
                disabled={scanning}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors rounded-lg"
              >
                <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Scan Networks'}
              </button>

              <button
                onClick={() => discoverDevices()}
                disabled={discovering}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors rounded-lg"
              >
                <Search className={`w-5 h-5 ${discovering ? 'animate-pulse' : ''}`} />
                {discovering ? 'Discovering...' : 'Discover Devices'}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium">Auto-refresh</span>
              </label>

              <button
                onClick={() => setShowNetworkDetails(!showNetworkDetails)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded"
              >
                {showNetworkDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showNetworkDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>
          </div>

          {/* Scan Metadata */}
          {scanMetadata && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{scanMetadata.totalAPs}</div>
                <div className="text-sm text-gray-600">Total Networks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{scanMetadata.secureAPs}</div>
                <div className="text-sm text-gray-600">Secure Networks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{scanMetadata.managedAPs}</div>
                <div className="text-sm text-gray-600">Managed Networks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{(scanMetadata.scanDuration / 1000).toFixed(1)}s</div>
                <div className="text-sm text-gray-600">Scan Duration</div>
              </div>
            </div>
          )}

          {/* Filters and Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Network Filter</label>
              <select
                value={networkFilter}
                onChange={(e) => setNetworkFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Networks</option>
                <option value="secure">Secure Only</option>
                <option value="open">Open Networks</option>
                <option value="managed">Managed Networks</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="signal">Signal Strength</option>
                <option value="name">Network Name</option>
                <option value="security">Security Level</option>
                <option value="devices">Device Count</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Device Filter</label>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Devices</option>
                <option value="online">Online Only</option>
                <option value="offline">Offline Only</option>
                <option value="esp32">ESP32 Devices</option>
                <option value="router">Routers/APs</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Networks Section */}
      <div className="max-w-7xl mx-auto mt-6 px-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Wifi className="w-6 h-6" />
              Available Networks ({filteredNetworks.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredNetworks.length > 0 ? (
              filteredNetworks.map((network, index) => {
                const signal = getSignalStrength(network.signalStrength);
                return (
                  <div
                    key={index}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedNetwork(network);
                      discoverDevices(network.ssid);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${signal.bgColor}`}>
                          <Signal className={`w-6 h-6 ${signal.color}`} />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-900">{network.ssid}</div>
                          <div className="text-sm text-gray-500 space-x-2">
                            <span>{network.bssid}</span>
                            <span>•</span>
                            <span>Channel {network.channel}</span>
                            <span>•</span>
                            <span className={signal.color}>{signal.quality}</span>
                            <span>•</span>
                            <span>{network.signalStrength} dBm</span>
                          </div>
                          {showNetworkDetails && (
                            <div className="text-xs text-gray-400 mt-1 space-x-2">
                              <span>Freq: {network.frequency} MHz</span>
                              <span>•</span>
                              <span>Last seen: {new Date(network.lastSeen).toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {network.isSecure ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                            <Lock className="w-3 h-3" />
                            {network.security.join(', ')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                            <Unlock className="w-3 h-3" />
                            Open
                          </div>
                        )}
                        {network.isManaged && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                            Managed
                          </span>
                        )}
                        {network.deviceType === 'esp32' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                            ESP32
                          </span>
                        )}
                        <div className="text-sm text-gray-500">
                          {network.deviceCount} devices
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Wifi className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-bold">No networks found</p>
                <p className="text-sm">Click "Scan Networks" to discover nearby WiFi networks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Devices Section */}
      {filteredDevices.length > 0 && (
        <div className="max-w-7xl mx-auto mt-6 px-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-6 h-6" />
                Discovered Devices ({filteredDevices.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {filteredDevices.map((device, index) => {
                const DeviceIcon = getDeviceIcon(device.type, device.deviceCategory);
                const signal = getSignalStrength(device.signalStrength);
                
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${device.isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <DeviceIcon className={`w-6 h-6 ${device.isOnline ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{device.name}</div>
                          <div className="text-sm text-gray-500">{device.manufacturer} {device.model}</div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${device.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {device.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span className="font-medium">{device.networkSSID}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IP Address:</span>
                        <span className="font-mono">{device.ipAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>MAC Address:</span>
                        <span className="font-mono text-xs">{device.macAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Signal:</span>
                        <span className={`font-medium ${signal.color}`}>{device.signalStrength} dBm ({signal.quality})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Power:</span>
                        <span className="font-medium">{device.powerRating}W</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="font-medium capitalize">{device.deviceCategory || device.type}</span>
                      </div>
                    </div>

                    {showNetworkDetails && device.services && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm text-gray-600 mb-2">Services:</div>
                        <div className="flex flex-wrap gap-1">
                          {device.services.map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {service}
                            </span>
                          ))}
                        </div>
                        {device.openPorts && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600 mb-1">Open Ports:</div>
                            <div className="text-xs text-gray-500 font-mono">
                              {device.openPorts.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => alert(`Would pair with ${device.name}`)}
                        className="w-full px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors rounded"
                      >
                        Connect Device
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="pb-12"></div>
    </div>
  );
}
