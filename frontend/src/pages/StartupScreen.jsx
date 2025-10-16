import { useState, useEffect } from 'react';
import { Package, CheckCircle, Loader2 } from 'lucide-react';

export default function StartupScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    'Initializing application',
    'Loading dependencies',
    'Configuring environment',
    'Starting services',
    'Ready to launch'
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
    }, 80);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const currentStep = Math.floor((progress / 100) * steps.length);
    setStep(currentStep);
  }, [progress]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-2xl mb-6">
            <Package className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-black mb-3">
            IoT Manager
          </h1>
          <p className="text-gray-600 text-lg">
            Building and initializing system...
          </p>
        </div>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm text-black font-semibold mb-3">
              <span>Build Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border-2 border-black">
              <div 
                className="bg-black h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Build Steps */}
          <div className="space-y-3 bg-gray-50 border-2 border-black rounded-lg p-6">
            {steps.map((stepText, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  index < step ? 'bg-white border-2 border-black' : 
                  index === step ? 'bg-black' : 
                  'bg-white border-2 border-gray-300'
                }`}
              >
                {index < step ? (
                  <CheckCircle className="w-5 h-5 text-black flex-shrink-0" />
                ) : index === step ? (
                  <Loader2 className="w-5 h-5 text-white flex-shrink-0 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex-shrink-0" />
                )}
                <span className={`text-sm font-semibold ${
                  index < step ? 'text-black' :
                  index === step ? 'text-white' :
                  'text-gray-400'
                }`}>
                  {stepText}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center pt-4">
            Please wait while we prepare your application...
          </p>
        </div>
      </div>
    </div>
  );
}
