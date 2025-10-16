import { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
      const body = isRegisterMode 
        ? { email, password, name }
        : { email, password };

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Invalid email or password. Please check your credentials or register a new account.');
        }
        if (response.status === 409) {
          throw new Error('An account with this email already exists. Please login instead.');
        }
        throw new Error(data.error || (isRegisterMode ? 'Registration failed' : 'Login failed'));
      }



      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        onLogin(data.data.user);
      } else {
        throw new Error(data.error || (isRegisterMode ? 'Registration failed' : 'Login failed'));
      }
    } catch (error) {
      console.error(isRegisterMode ? 'Registration error:' : 'Login error:', error);
      setError(error.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-lg mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            IoT Manager
          </h1>
          <p className="text-gray-600">
            Professional Device Management System
          </p>
        </div>

        
        <div className="bg-white border-2 border-black rounded-lg p-8">
          <h2 className="text-2xl font-bold text-black mb-6">
            {isRegisterMode ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field (only for registration) */}
            {isRegisterMode && (
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white text-black placeholder-gray-400"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white text-black placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white text-black placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
              {isRegisterMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-600 rounded-lg">
                <AlertCircle className="w-5 h-5 text-black flex-shrink-0" />
                <p className="text-sm text-black">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isRegisterMode ? 'Creating account...' : 'Signing in...'}
                </div>
              ) : (
                isRegisterMode ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <p className="text-center text-sm text-gray-600">
              {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setName('');
                }}
                className="text-black font-semibold hover:underline"
              >
                {isRegisterMode ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>

          {/* Demo Credentials - only show in login mode */}
          {!isRegisterMode && (
            <div className="mt-4 pt-4 border-t-2 border-black">
              <p className="text-xs text-gray-600 text-center mb-2 font-semibold">Demo Credentials:</p>
              <div className="bg-gray-50 rounded-lg p-3 border-2 border-black">
                <p className="text-xs text-black font-mono"><strong>Email:</strong> dummy@gmail.com</p>
                <p className="text-xs text-black font-mono"><strong>Password:</strong> dummy123</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6 font-medium">
          © 2025 IoT Manager. All rights reserved.
        </p>
      </div>
    </div>
  );
}
