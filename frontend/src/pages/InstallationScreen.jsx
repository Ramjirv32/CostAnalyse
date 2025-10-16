import { useState, useEffect } from 'react';
import { Download, CheckCircle } from 'lucide-react';

export default function InstallationScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    'Checking system requirements',
    'Installing dependencies',
    'Configuring environment',
    'Setting up database',
    'Finalizing installation'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const currentStep = Math.floor((progress / 100) * steps.length);
    setStep(currentStep);
  }, [progress]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Download className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Installing IoT Manager
          </h1>
          <p className="text-gray-600">
            Setting up your smart device management system
          </p>
        </div>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Installation Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Installation Steps */}
          <div className="space-y-3">
            {steps.map((stepText, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  index < step ? 'bg-green-50' : 
                  index === step ? 'bg-blue-50' : 
                  'bg-gray-50'
                }`}
              >
                {index < step ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                    index === step ? 'border-blue-600 animate-pulse' : 'border-gray-300'
                  }`} />
                )}
                <span className={`text-sm ${
                  index < step ? 'text-green-700 font-medium' :
                  index === step ? 'text-blue-700 font-medium' :
                  'text-gray-500'
                }`}>
                  {stepText}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center pt-4">
            Please wait while we set everything up for you...
          </p>
        </div>
      </div>
    </div>
  );
}
