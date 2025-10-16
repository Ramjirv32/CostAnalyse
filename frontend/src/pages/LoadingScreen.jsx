import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Loading IoT Manager</h2>
        <p className="text-white/80">Initializing your dashboard...</p>
      </div>
    </div>
  );
}
