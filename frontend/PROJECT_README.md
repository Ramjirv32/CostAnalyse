# IoT Device Manager - Electron App

A beautiful IoT device management application built with React, Vite, TailwindCSS, and Electron.

## 🎯 Features

### ✅ Installation Flow
- **Installation Screen**: Animated progress bar showing setup steps
- **Loading Screen**: Smooth transition with loading animation
- **Settings Screen**: Node.js environment configuration with multiple options
- **First-run detection**: Setup only runs once, then goes straight to dashboard

### 📊 Dashboard Features
- **Real-time Statistics**: Active devices, power usage, and daily costs
- **Device Management**: Add, remove, and monitor IoT devices
- **Device Controls**: Turn devices on/off with visual feedback
- **Usage Visualization**: 7-day power usage line chart
- **Cost Analysis**: Daily cost bar chart with pricing breakdown
- **Device Types**: Support for lights, fans, AC, TV, and custom devices

### 💡 Supported Device Types
- 💡 **Lights** - Track lighting power consumption
- 🌀 **Fans** - Monitor fan usage
- ❄️ **Air Conditioners** - Control HVAC systems
- 📺 **Televisions** - Manage entertainment devices
- ⚡ **Other** - Custom IoT devices

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Start Vite dev server:**
```bash
npm run dev
```

**Terminal 2 - Start Electron app:**
```bash
npm run electron:dev
```

The app will open in a **1200×800** Electron window displaying your IoT dashboard.

## 🔄 Reset Setup Flow

To see the installation flow again, you have two options:

**Option 1: Clear localStorage in DevTools**
1. Open DevTools in the Electron app (Ctrl+Shift+I)
2. Go to Application > Local Storage
3. Delete the `setupCompleted` key
4. Refresh the app

**Option 2: Clear from Browser Console**
```javascript
localStorage.removeItem('setupCompleted');
location.reload();
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── InstallationScreen.jsx  # Step 1: Installation progress
│   │   ├── LoadingScreen.jsx       # Step 2: Loading animation
│   │   ├── SettingsScreen.jsx      # Step 3: Node.js config
│   │   └── Dashboard.jsx           # Step 4: Main app interface
│   ├── App.jsx                     # Main app with screen routing
│   └── index.css                   # TailwindCSS imports
├── main.cjs                        # Electron main process
├── preload.cjs                     # Electron preload script
└── package.json                    # Dependencies & scripts
```

## 🎨 UI Components

### Installation Screen
- 5-step animated installation process
- Real-time progress bar
- Beautiful gradient background
- Auto-progresses to next screen

### Settings Screen
- Three configuration options:
  - ✅ Automatic Installation (Recommended)
  - ⚙️ Manual Configuration
  - 🔄 Use Existing Installation
- Modern card-based selection UI
- Smooth transitions

### Dashboard
- **Header**: App branding and settings access
- **Stats Cards**: Active devices, power usage, daily cost
- **Charts**: Recharts-powered visualizations
- **Device List**: Interactive device management
- **Add Device Form**: Inline form for adding new devices

## 🛠️ Technologies Used

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Styling framework
- **Electron** - Desktop app framework
- **Lucide React** - Beautiful icons
- **Recharts** - Chart library for data visualization
- **localStorage** - First-run detection

## 🎯 Future Enhancements (Backend Integration)

When you're ready to add the backend:

1. **Real Device Integration**
   - Connect to actual IoT devices via MQTT/HTTP
   - Real-time data streaming
   - Device discovery and pairing

2. **Data Persistence**
   - Store device configurations in database
   - Historical data tracking
   - User preferences

3. **Advanced Features**
   - Scheduling/automation
   - Energy usage predictions
   - Cost optimization suggestions
   - Multi-user support
   - Remote access via cloud

4. **Containerization**
   - Docker support
   - Backend API containerization
   - Database container setup

## 🎨 Customization

### Change Window Size
Edit `main.cjs`:
```javascript
width: 1200,  // Your preferred width
height: 800,  // Your preferred height
```

### Modify Color Scheme
The app uses Tailwind's default palette. Customize in components:
- Primary: `indigo-600`, `purple-600`
- Success: `green-600`
- Danger: `red-600`
- Warning: `yellow-600`

### Add More Device Types
In `Dashboard.jsx`, add to `deviceIcons`:
```javascript
const deviceIcons = {
  light: Lightbulb,
  fan: Fan,
  // Add your custom types here
  heater: Flame,
  camera: Camera,
};
```

## 📊 Dummy Data

The app currently uses simulated data:
- **Usage Chart**: 7 days of dummy power usage (kWh)
- **Cost Chart**: Calculated at $0.20/kWh rate
- **Device Readings**: Generated based on device wattage

Replace with real backend data when ready!

## 💾 Data Storage

Currently uses **localStorage** for:
- Setup completion flag
- (Future) Device configurations
- (Future) User preferences

Will migrate to proper database with backend integration.

## 🐛 Troubleshooting

**App shows installation screen every time:**
- Check if localStorage is being cleared
- Verify `setupCompleted` key persists

**Charts not rendering:**
- Ensure `recharts` is installed: `npm install recharts`
- Check browser console for errors

**Electron won't start:**
- Run `npm install` to ensure all dependencies are installed
- Make sure Vite dev server is running on port 5173

## 📝 Notes

- First run shows: Installation → Loading → Settings → Dashboard
- Subsequent runs go directly to Dashboard
- All device data is currently client-side only
- No backend required for current version
- Ready for backend integration when you're ready!

---

**Enjoy building your IoT management system! 🚀**
