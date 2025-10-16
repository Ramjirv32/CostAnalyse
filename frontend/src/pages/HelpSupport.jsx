import { HelpCircle, Book, MessageSquare, Mail, ExternalLink } from 'lucide-react';

export default function HelpSupport() {
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
    </div>
  );
}
