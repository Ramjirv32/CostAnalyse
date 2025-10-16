import { useState, useEffect } from 'react';
import StartupScreen from './pages/StartupScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import WiFiDevices from './pages/WiFiDevices';
import './index.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('startup');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check if user is already logged in and if startup has been shown
  useEffect(() => {
    const hasSeenStartup = sessionStorage.getItem('hasSeenStartup');
    const storedUser = localStorage.getItem('user');
    
    if (hasSeenStartup && storedUser) {
      // Skip startup screens if already shown in this session
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
      setCurrentScreen('dashboard');
    } else if (hasSeenStartup) {
      // Skip to login if startup already shown
      setCurrentScreen('login');
    }
    // Otherwise start with startup screen
  }, []);

  const handleStartupComplete = () => {
    setCurrentScreen('welcome');
  };

  const handleWelcomeComplete = () => {
    sessionStorage.setItem('hasSeenStartup', 'true');
    setCurrentScreen('login');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    setCurrentScreen('login');
  };

  // Render appropriate screen
  if (currentScreen === 'startup') {
    return <StartupScreen onComplete={handleStartupComplete} />;
  }

  if (currentScreen === 'welcome') {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentScreen === 'dashboard') {
    return <Dashboard user={user} onLogout={handleLogout} onNavigateToWiFi={() => setCurrentScreen('wifi')} />;
  }

  if (currentScreen === 'wifi') {
    return <WiFiDevices user={user} onBack={() => setCurrentScreen('dashboard')} />;
  }

  return null;
}

export default App;
