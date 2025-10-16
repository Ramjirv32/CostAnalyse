import { useState } from 'react';
import { Settings, CheckCircle, ChevronRight } from 'lucide-react';

export default function SettingsScreen({ onComplete }) {
  const [selectedOption, setSelectedOption] = useState('auto');
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleContinue = () => {
    setIsConfiguring(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Settings className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configure Node.js Environment
          </h1>
          <p className="text-gray-600">
            Choose how you want to set up your development environment
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Auto Install Option */}
          <button
            onClick={() => setSelectedOption('auto')}
            className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
              selectedOption === 'auto' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === 'auto' ? 'border-indigo-600' : 'border-gray-300'
                  }`}>
                    {selectedOption === 'auto' && (
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Automatic Installation (Recommended)
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-8">
                  Automatically detect and install the recommended Node.js version with all required dependencies. Perfect for quick setup.
                </p>
              </div>
            </div>
          </button>

          {/* Manual Install Option */}
          <button
            onClick={() => setSelectedOption('manual')}
            className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
              selectedOption === 'manual' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === 'manual' ? 'border-indigo-600' : 'border-gray-300'
                  }`}>
                    {selectedOption === 'manual' && (
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manual Configuration
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-8">
                  Use your existing Node.js installation or specify a custom path. For advanced users who want full control.
                </p>
              </div>
            </div>
          </button>

          {/* Use Existing Option */}
          <button
            onClick={() => setSelectedOption('existing')}
            className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
              selectedOption === 'existing' 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === 'existing' ? 'border-indigo-600' : 'border-gray-300'
                  }`}>
                    {selectedOption === 'existing' && (
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Use Existing Installation
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-8">
                  Skip installation and use the Node.js version already installed on your system.
                </p>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={isConfiguring}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isConfiguring ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Configuring...
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          You can change these settings later in the application preferences
        </p>
      </div>
    </div>
  );
}
