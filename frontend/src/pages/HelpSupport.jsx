import { useState, useEffect } from 'react';
import { HelpCircle, Book, MessageSquare, Mail, ExternalLink, Bot, Send, X, Minimize2 } from 'lucide-react';

export default function HelpSupport() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
    // Initialize with welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 1,
        text: "Hello! I'm your PowerAI assistant. I can help you with device management, energy usage, and any questions about your system. What would you like to know?",
        isBot: true,
        timestamp: new Date()
      }]);
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch user devices and preferences
      const [devicesRes, currencyRes] = await Promise.all([
        fetch('http://localhost:5000/api/devices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/currency', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const devicesData = devicesRes.ok ? await devicesRes.json() : null;
      const currencyData = currencyRes.ok ? await currencyRes.json() : null;

      setUserData({
        devices: devicesData?.success ? devicesData.data : [],
        currency: currencyData?.success ? currencyData.data : null,
        user: JSON.parse(localStorage.getItem('user') || '{}')
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Device-related queries
    if (message.includes('device') || message.includes('connect') || message.includes('setup')) {
      const deviceCount = userData?.devices?.length || 0;
      return `You currently have ${deviceCount} devices registered in your system. You can add new devices by going to the Device List section and clicking "Add Device". For WiFi devices, make sure your ESP32 is properly configured and connected to your network.`;
    }
    
    // Energy usage queries
    if (message.includes('energy') || message.includes('usage') || message.includes('consumption')) {
      return `You can view your energy consumption in the Analytics and Statistics sections. Your current electricity rate is ${userData?.currency?.electricityRate || 0.12} per kWh in ${userData?.currency?.selectedCurrency || 'USD'}. The system tracks daily usage and calculates costs automatically.`;
    }
    
    // Currency/cost queries
    if (message.includes('cost') || message.includes('price') || message.includes('currency') || message.includes('money')) {
      const currency = userData?.currency?.selectedCurrency || 'USD';
      const rate = userData?.currency?.electricityRate || 0.12;
      return `Your current currency is set to ${currency} with an electricity rate of ${rate} per kWh. You can change these settings in the Currency Settings section. The system will automatically convert all costs to your preferred currency.`;
    }
    
    // WiFi/ESP32 queries
    if (message.includes('wifi') || message.includes('esp32') || message.includes('wireless')) {
      return `For WiFi device management, go to the WiFi Management section. You can register new ESP32 controllers and approve device connections. Make sure your ESP32 is connected to the same network as your monitoring system. Need help with ESP32 setup? Check the device documentation.`;
    }
    
    // Reports queries
    if (message.includes('report') || message.includes('download') || message.includes('export')) {
      return `You can generate and download detailed reports in the Reports section. Choose from today, specific dates, or date ranges. Reports can be downloaded as CSV, JSON, or PDF formats with complete device-wise expense calculations.`;
    }
    
    // General help
    if (message.includes('help') || message.includes('how') || message.includes('what')) {
      return `I can help you with:
      • Device management and setup
      • Energy usage monitoring
      • Cost calculations and currency settings
      • WiFi device connections
      • Report generation and downloads
      • System navigation and features
      
      What specific topic would you like help with?`;
    }
    
    // User-specific info
    if (message.includes('my') || message.includes('account') || message.includes('profile')) {
      const user = userData?.user || {};
      return `Your account details:
      • Name: ${user.name || 'Not set'}
      • Email: ${user.email || 'Not available'}
      • Registered Devices: ${userData?.devices?.length || 0}
      • Currency: ${userData?.currency?.selectedCurrency || 'USD'}
      • Electricity Rate: ${userData?.currency?.electricityRate || 0.12} per kWh
      
      You can update these settings in the respective sections.`;
    }
    
    // Default response
    const defaultResponses = [
      "I'd be happy to help! Could you please be more specific about what you need assistance with?",
      "I can help you with device management, energy monitoring, reports, and system settings. What would you like to know more about?",
      "For the best assistance, try asking about specific features like 'how to add devices' or 'energy usage reports'.",
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: generateBotResponse(inputMessage),
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Help & Support</h1>
          <p className="text-gray-600">Get help and learn how to use PowerAI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Book className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-black mb-2">Documentation</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Complete guides and tutorials for using PowerAI
                </p>
                <button className="text-sm text-blue-600 font-semibold flex items-center gap-1">
                  Read Docs <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-black mb-2">Community Forum</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Ask questions and get help from the community
                </p>
                <button className="text-sm text-green-600 font-semibold flex items-center gap-1">
                  Visit Forum <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-black mb-2">Email Support</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Contact our support team directly
                </p>
                <button className="text-sm text-purple-600 font-semibold flex items-center gap-1">
                  Send Email <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <HelpCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-black mb-2">FAQ</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Find answers to common questions
                </p>
                <button className="text-sm text-orange-600 font-semibold flex items-center gap-1">
                  View FAQ <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Chatbot Card */}
          <div 
            onClick={() => setShowChatbot(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer text-white"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-2">AI Assistant</h3>
                <p className="text-sm text-white/90 mb-3">
                  Get instant help from our AI assistant trained on your data
                </p>
                <button className="text-sm text-white font-semibold flex items-center gap-1 bg-white/20 px-3 py-1 rounded">
                  Start Chat <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-black mb-4">Quick Start Guide</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Add Your Devices</h3>
                <p className="text-sm text-gray-600">Click "Add Device" to register your IoT devices with their power ratings.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Turn Devices Online</h3>
                <p className="text-sm text-gray-600">Click the power button on each device to turn them online and start tracking.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Monitor Energy Flow</h3>
                <p className="text-sm text-gray-600">Watch real-time power consumption and costs update every second.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">View Analytics</h3>
                <p className="text-sm text-gray-600">Check charts and statistics to understand your energy usage patterns.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Interface */}
      {showChatbot && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-end p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-96 flex flex-col">
            {/* Chatbot Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <h3 className="font-semibold">PowerAI Assistant</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowChatbot(false)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowChatbot(false)}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.isBot
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                    }`}
                  >
                    {message.isBot && (
                      <div className="flex items-center gap-1 mb-1">
                        <Bot className="w-3 h-3" />
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-white/70'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-xs px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-800">
                    <div className="flex items-center gap-1 mb-1">
                      <Bot className="w-3 h-3" />
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your energy system..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
