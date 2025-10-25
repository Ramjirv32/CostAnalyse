import { useState, useEffect } from 'react';
import { 
  Wifi, 
  Cpu, 
  Plus, 
  Check, 
  X, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Signal, 
  Activity,
  MapPin,
  Clock,
  RefreshCw,
  Shield,
  Settings
} from 'lucide-react';

export default function WiFiManagement({ user }) {
  const [esp32Controllers, setEsp32Controllers] = useState([]);
  const [wifiDevices, setWifiDevices] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState({ esp32: [], devices: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedESP32, setSelectedESP32] = useState(null);
  const [showAddESP32, setShowAddESP32] = useState(false);
  const [showDeviceDetails, setShowDeviceDetails] = useState(null);

  // Form states
  const [newESP32, setNewESP32] = useState({
    name: '',
    macAddress: '',
    ipAddress: '',
    location: '',
    wifiSSID: '',
    maxConnectedDevices: 10
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [esp32Res, devicesRes, approvalsRes] = await Promise.all([
        fetch('http://localhost:5000/api/wifi-management/esp32', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wifi-management/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/wifi-management/pending-approvals', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (esp32Res.ok) {
        const esp32Data = await esp32Res.json();
        if (esp32Data.success) {
          setEsp32Controllers(esp32Data.data);
        }
      }

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        if (devicesData.success) {
          setWifiDevices(devicesData.data);
        }
      }

      if (approvalsRes.ok) {
        const approvalsData = await approvalsRes.json();
        if (approvalsData.success) {
          setPendingApprovals(approvalsData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching WiFi data:', error);
      setError('Failed to load WiFi management data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddESP32 = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wifi-management/esp32', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newESP32)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add ESP32');
      }

      if (data.success) {
        setEsp32Controllers(prev => [...prev, data.data]);
        setNewESP32({
          name: '',
          macAddress: '',
          ipAddress: '',
          location: '',
          wifiSSID: '',
          maxConnectedDevices: 10
        });
        setShowAddESP32(false);
        fetchAllData(); // Refresh data
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleApproveESP32 = async (esp32Id, approved) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi-management/esp32/${esp32Id}/approval`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved })
      });

      const data = await response.json();

      if (data.success) {
        fetchAllData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to update ESP32 approval');
    }
  };

  const handleApproveDevice = async (deviceId, approved, rejectionReason = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/wifi-management/devices/${deviceId}/approval`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved, rejectionReason })
      });

      const data = await response.json();

      if (data.success) {
        fetchAllData(); // Refresh data
      }
    } catch (error) {
      setError('Failed to update device approval');
    }
  };

  const getESP32DevicesCount = (esp32Id) => {
    return wifiDevices.filter(device => 
      device.esp32Id === esp32Id && device.connectionStatus === 'connected'
    ).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <span>Loading WiFi Management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg">
            <Wifi className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black">WiFi Device Management</h2>
            <p className="text-gray-600">Manage ESP32 controllers and connected devices</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchAllData}
            className="p-2 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddESP32(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add ESP32
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-600 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Approvals */}
      {(pendingApprovals.esp32.length > 0 || pendingApprovals.devices.length > 0) && (
        <div className="bg-yellow-50 border-2 border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Pending Approvals</h3>
          </div>

          {/* Pending ESP32 Controllers */}
          {pendingApprovals.esp32.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">ESP32 Controllers ({pendingApprovals.esp32.length})</h4>
              <div className="space-y-2">
                {pendingApprovals.esp32.map(esp32 => (
                  <div key={esp32._id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{esp32.name}</p>
                        <p className="text-sm text-gray-500">{esp32.macAddress} • {esp32.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveESP32(esp32._id, true)}
                        className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApproveESP32(esp32._id, false)}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Device Connections */}
          {pendingApprovals.devices.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Device Connections ({pendingApprovals.devices.length})</h4>
              <div className="space-y-2">
                {pendingApprovals.devices.map(device => (
                  <div key={device._id} className="flex items-center justify-between bg-white p-3 rounded border">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{device.device?.name || 'Unknown Device'}</p>
                        <p className="text-sm text-gray-500">
                          {device.deviceMAC} → {device.esp32?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveDevice(device._id, true)}
                        className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApproveDevice(device._id, false, 'Denied by user')}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ESP32 Controllers Grid */}
      <div>
        <h3 className="text-lg font-semibold text-black mb-4">ESP32 Controllers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {esp32Controllers.map(esp32 => (
            <div 
              key={esp32._id} 
              className="bg-white border-2 border-black rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedESP32(esp32._id)}
            >
              {/* ESP32 Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    esp32.status === 'online' ? 'bg-green-100 text-green-600' : 
                    esp32.status === 'offline' ? 'bg-red-100 text-red-600' : 
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">{esp32.name}</h4>
                    <p className="text-xs text-gray-500">{esp32.macAddress}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  esp32.status === 'online' ? 'bg-green-100 text-green-600' :
                  esp32.status === 'offline' ? 'bg-red-100 text-red-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {esp32.status}
                </span>
              </div>

              {/* ESP32 Details */}
              <div className="space-y-2 text-sm">
                {esp32.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{esp32.location}</span>
                  </div>
                )}
                
                {esp32.ipAddress && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Signal className="w-4 h-4" />
                    <span>{esp32.ipAddress}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Activity className="w-4 h-4" />
                  <span>{getESP32DevicesCount(esp32._id)}/{esp32.maxConnectedDevices} devices</span>
                </div>

                {esp32.lastSeen && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Last seen: {new Date(esp32.lastSeen).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Connected Devices Progress */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Device Usage</span>
                  <span>{getESP32DevicesCount(esp32._id)}/{esp32.maxConnectedDevices}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(getESP32DevicesCount(esp32._id) / esp32.maxConnectedDevices) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Devices by ESP32 */}
      {selectedESP32 && (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">
              Devices connected to {esp32Controllers.find(e => e._id === selectedESP32)?.name}
            </h3>
            <button
              onClick={() => setSelectedESP32(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {wifiDevices
              .filter(device => device.esp32Id === selectedESP32 && device.connectionStatus === 'connected')
              .map(device => (
                <div key={device._id} className="bg-white border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{device.device?.name || 'Unknown Device'}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      device.connectionStatus === 'connected' ? 'bg-green-100 text-green-600' :
                      device.connectionStatus === 'pending_approval' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {device.connectionStatus}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>MAC: {device.deviceMAC}</p>
                    {device.deviceIP && <p>IP: {device.deviceIP}</p>}
                    {device.signalStrength && (
                      <p>Signal: {device.signalStrength} dBm</p>
                    )}
                    <p>Connected: {new Date(device.connectionTime).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => setShowDeviceDetails(device)}
                      className="flex-1 py-1 px-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Details
                    </button>
                    <button
                      className="flex-1 py-1 px-2 text-xs border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <Edit3 className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      className="flex-1 py-1 px-2 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      Remove
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Add ESP32 Modal */}
      {showAddESP32 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New ESP32 Controller</h3>
              <button
                onClick={() => setShowAddESP32(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="ESP32 Name"
                value={newESP32.name}
                onChange={(e) => setNewESP32(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              
              <input
                type="text"
                placeholder="MAC Address (xx:xx:xx:xx:xx:xx)"
                value={newESP32.macAddress}
                onChange={(e) => setNewESP32(prev => ({ ...prev, macAddress: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              
              <input
                type="text"
                placeholder="IP Address (optional)"
                value={newESP32.ipAddress}
                onChange={(e) => setNewESP32(prev => ({ ...prev, ipAddress: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              
              <input
                type="text"
                placeholder="Location"
                value={newESP32.location}
                onChange={(e) => setNewESP32(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              
              <input
                type="text"
                placeholder="WiFi SSID"
                value={newESP32.wifiSSID}
                onChange={(e) => setNewESP32(prev => ({ ...prev, wifiSSID: e.target.value }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              
              <input
                type="number"
                placeholder="Max Connected Devices"
                min="1"
                max="50"
                value={newESP32.maxConnectedDevices}
                onChange={(e) => setNewESP32(prev => ({ ...prev, maxConnectedDevices: parseInt(e.target.value) || 10 }))}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddESP32(false)}
                  className="flex-1 py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddESP32}
                  className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Add ESP32
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Details Modal */}
      {showDeviceDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Device Details</h3>
              <button
                onClick={() => setShowDeviceDetails(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Device Name:</label>
                <p className="text-black">{showDeviceDetails.device?.name || 'Unknown Device'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">ESP32 Controller:</label>
                <p className="text-black">{showDeviceDetails.esp32?.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">MAC Address:</label>
                <p className="font-mono text-black">{showDeviceDetails.deviceMAC}</p>
              </div>
              
              {showDeviceDetails.deviceIP && (
                <div>
                  <label className="text-sm font-medium text-gray-600">IP Address:</label>
                  <p className="font-mono text-black">{showDeviceDetails.deviceIP}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Connection Status:</label>
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  showDeviceDetails.connectionStatus === 'connected' ? 'bg-green-100 text-green-600' :
                  showDeviceDetails.connectionStatus === 'pending_approval' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {showDeviceDetails.connectionStatus}
                </span>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Connected Since:</label>
                <p className="text-black">{new Date(showDeviceDetails.connectionTime).toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Last Activity:</label>
                <p className="text-black">{new Date(showDeviceDetails.lastActivity).toLocaleString()}</p>
              </div>
              
              {showDeviceDetails.signalStrength && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Signal Strength:</label>
                  <p className="text-black">{showDeviceDetails.signalStrength} dBm</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowDeviceDetails(null)}
              className="mt-6 w-full py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}