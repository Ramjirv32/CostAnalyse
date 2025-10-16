import { useState, useEffect } from 'react';
import { Bell, AlertCircle, CheckCircle, Info, Mail, Clock, XCircle } from 'lucide-react';

export default function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    testMode: false
  });

  useEffect(() => {
    // Simulated alerts - in production, fetch from backend
    const sampleAlerts = [
      {
        id: 1,
        type: 'info',
        title: 'Welcome to PowerAI!',
        message: 'Your energy monitoring system is now active. Start adding devices to track your consumption.',
        timestamp: new Date(),
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Energy Simulator Active',
        message: 'Background energy simulation is running. Your charts will populate with realistic data.',
        timestamp: new Date(Date.now() - 300000),
        read: false
      },
      {
        id: 3,
        type: 'warning',
        title: 'Device Inactive',
        message: 'Living Room Light has been inactive for 24 hours. Email alert sent.',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ];
    setAlerts(sampleAlerts);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' };
      case 'warning': return { icon: AlertCircle, bg: 'bg-orange-100', color: 'text-orange-600' };
      case 'error': return { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' };
      default: return { icon: Info, bg: 'bg-blue-100', color: 'text-blue-600' };
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Notifications & Alerts</h1>
          <p className="text-gray-600">Alerts and updates about your energy usage</p>
        </div>

        {/* Email Alert Settings */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-black">Email Alert Settings</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-black">Email Notifications</p>
                <p className="text-xs text-gray-600">Receive alerts via email</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={emailSettings.enabled}
                  onChange={(e) => setEmailSettings({...emailSettings, enabled: e.target.checked})}
                />
                <div className="w-12 h-6 bg-gray-300 peer-checked:bg-black rounded-full peer transition-all"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-black">Test Mode</p>
                <p className="text-xs text-gray-600">Send test emails every 5 seconds</p>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={emailSettings.testMode}
                  onChange={(e) => setEmailSettings({...emailSettings, testMode: e.target.checked})}
                />
                <div className="w-12 h-6 bg-gray-300 peer-checked:bg-orange-500 rounded-full peer transition-all"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-6 transition-all"></div>
              </label>
            </div>
            {emailSettings.testMode && (
              <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
                <p className="text-xs text-orange-800 font-semibold">
                  ⚠️ Test mode active: Emails will be sent every 5 seconds to {user?.email || 'your email'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.map((alert) => {
            const { icon: Icon, bg, color } = getIcon(alert.type);
            return (
              <div key={alert.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${bg} rounded-lg`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-black">{alert.title}</h3>
                      {!alert.read && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">Smart Alerts Active</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The system monitors your devices 24/7 and sends alerts for:
            </p>
            <ul className="text-left max-w-md mx-auto mt-4 space-y-2 text-sm text-gray-700">
              <li>✅ Devices inactive for more than 24 hours</li>
              <li>✅ High energy consumption warnings</li>
              <li>✅ Cost threshold alerts</li>
              <li>✅ Device connection status changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
