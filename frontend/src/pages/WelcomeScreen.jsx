import { useEffect } from 'react';
import { Activity, ArrowRight } from 'lucide-react';

export default function WelcomeScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-3xl mb-8 animate-pulse">
          <Activity className="w-16 h-16 text-black" />
        </div>
        
        {/* Welcome Text */}
        <h1 className="text-5xl font-bold text-white mb-4">
          Welcome to IoT Manager
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Professional Device Management System
        </p>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center gap-2 text-white">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          Redirecting to login...
        </p>
      </div>
    </div>
  );
}
