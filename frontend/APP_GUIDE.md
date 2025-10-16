# IoT Device Manager - Professional Black & White Edition

## 🎨 Design Philosophy

A professional, enterprise-grade IoT device management system with a clean **black and white only** color scheme. No colors - just pure monochrome design for a sophisticated look.

---

## 🔐 Authentication System

### Login Credentials
```
Email: dummy@gmail.com
Password: dummy
```

### Features
- ✅ Secure login with validation
- ✅ Session persistence (stays logged in)
- ✅ Logout functionality
- ✅ User info display in header
- ✅ Demo credentials shown on login screen

### Login Flow
1. App opens to login screen
2. Enter credentials (or use demo credentials)
3. Click "Sign In"
4. Automatically navigated to dashboard
5. Session persists across app restarts

---

## 📊 Dashboard Features

### Header
- **Black background** with white text
- User name and email displayed
- Logout button (top right)
- App logo and branding

### Statistics Cards (3 Cards)
- **Active Devices** - Shows count of running devices
- **Current Power** - Real-time power consumption in kW
- **Today's Cost** - Daily electricity cost calculation
- All cards: White background, black borders, bold typography

### Charts (2 Charts)
- **Power Usage Chart** - Line chart showing 7-day usage history
- **Daily Cost Chart** - Bar chart showing cost breakdown
- Charts use black lines/bars on white background
- Professional grid layout

### Device Management
- **Add Device Button** - Black button, white text
- **Device Form** - Clean input fields with black borders
- **Device Cards** - Show device name, type, power, status
- **Toggle Controls** - Turn devices ON/OFF
- **Remove Button** - Delete devices from list

### Device Status Indicators
- **ON Status** - Black background with white icon
- **OFF Status** - White background with gray icon
- Status badges use black/white/gray only

---

## 🎯 How to Use

### 1. Login
```bash
# Start the app
npm run dev           # Terminal 1
npm run electron:dev  # Terminal 2

# Login with:
Email: dummy@gmail.com
Password: dummy
```

### 2. Add Devices
1. Click "Add Device" button
2. Enter device name (e.g., "Living Room Light")
3. Select device type (Light, Fan, AC, TV, Other)
4. Enter power consumption in Watts
5. Click "Add" button

### 3. Control Devices
- **Turn ON/OFF**: Click the power button on each device
- **Remove Device**: Click the "Remove" button
- **View Stats**: See real-time power and cost updates

### 4. View Analytics
- **Power Usage Chart**: Monitor 7-day consumption trends
- **Cost Chart**: Track daily electricity expenses
- **Live Statistics**: See active devices and current usage

### 5. Logout
- Click "Logout" button in top-right header
- Returns to login screen
- Can login again with same credentials

---

## 🎨 Color Scheme

### Strictly Black & White
```
Primary Black: #000000
Pure White: #FFFFFF
Gray 50: #F9FAFB (subtle backgrounds)
Gray 200: #E5E7EB (borders, dividers)
Gray 300: #D1D5DB (inactive elements)
Gray 600: #4B5563 (secondary text)
```

### NO Other Colors Used
- ❌ No blue, green, red, purple, etc.
- ✅ Only black, white, and gray shades
- ✅ Professional, enterprise-grade appearance
- ✅ High contrast for readability

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── LoginScreen.jsx       # Authentication page
│   │   └── Dashboard.jsx         # Main app (black/white theme)
│   ├── App.jsx                   # Auth routing logic
│   └── index.css                 # TailwindCSS
├── main.cjs                      # Electron main process
├── preload.cjs                   # Electron preload
└── package.json                  # Dependencies
```

---

## 🔄 Application Flow

```
Start App
    ↓
Check if logged in?
    ├─ NO → Show Login Screen
    │         ↓
    │   Enter Credentials
    │         ↓
    │   Validate (dummy@gmail.com / dummy)
    │         ↓
    │   Save to localStorage
    │         ↓
    └─ YES → Show Dashboard
              ↓
        Add/Manage Devices
              ↓
        View Statistics
              ↓
        Logout (optional)
              ↓
        Return to Login
```

---

## 💾 Data Storage

### localStorage Keys
- `user` - Stores logged-in user info (JSON)
  ```json
  {
    "email": "dummy@gmail.com",
    "name": "Admin User"
  }
  ```

### Device Data
- Currently stored in component state (React useState)
- Resets on app restart
- Ready for backend integration

---

## 🚀 Running the App

### Development Mode
```bash
# Terminal 1 - Start Vite dev server
npm run dev

# Terminal 2 - Start Electron app (1200x800 window)
npm run electron:dev
```

### To Reset Login
```javascript
// In browser DevTools console:
localStorage.removeItem('user');
location.reload();
```

---

## 🔧 Customization

### Change Window Size
Edit `main.cjs`:
```javascript
width: 1200,  // Change width
height: 800,  // Change height
```

### Add More Device Types
Edit `Dashboard.jsx`:
```javascript
const deviceIcons = {
  light: Lightbulb,
  fan: Fan,
  ac: Thermometer,
  tv: Tv,
  heater: Flame,      // Add new type
  camera: Camera,     // Add new type
  other: Zap
};
```

### Modify Demo Credentials
Edit `LoginScreen.jsx`:
```javascript
if (email === 'your@email.com' && password === 'yourpass') {
  // Allow login
}
```

---

## 🎯 Professional Features

### Enterprise-Grade Design
- ✅ Clean monochrome interface
- ✅ Bold typography for hierarchy
- ✅ Consistent spacing and layout
- ✅ Professional border usage
- ✅ High contrast for accessibility

### Software-Like Experience
- ✅ Desktop app feel (Electron)
- ✅ No browser chrome visible
- ✅ Native window controls
- ✅ Fast load times
- ✅ Smooth transitions

### Security Considerations
- ✅ Password field (masked input)
- ✅ Login validation
- ✅ Session management
- ✅ Logout capability
- ⚠️ Currently uses dummy credentials (add backend for production)

---

## 📈 Next Steps (Backend Integration)

When ready to add backend:

1. **Replace Dummy Login**
   - Connect to real authentication API
   - Add JWT tokens
   - Implement proper password hashing

2. **Device Persistence**
   - Store devices in database
   - Sync across sessions
   - Multi-user device management

3. **Real Device Integration**
   - Connect to actual IoT devices
   - MQTT/WebSocket communication
   - Real-time data streaming

4. **Advanced Features**
   - Device scheduling
   - Usage alerts
   - Cost optimization
   - Historical data analysis

---

## 🐛 Troubleshooting

**Login not working?**
- Check credentials: `dummy@gmail.com` / `dummy`
- Check browser console for errors

**App won't start?**
- Ensure Vite is running on port 5173
- Run `npm install` to install dependencies

**Devices not showing?**
- Data is in memory, resets on refresh
- Add backend for persistence

**Can't logout?**
- Check if logout button is visible (top-right)
- Clear localStorage manually if needed

---

## 📝 Summary

**What You Have:**
- ✅ Professional black and white design
- ✅ Login authentication system
- ✅ Session persistence
- ✅ Device management interface
- ✅ Power usage visualization
- ✅ Cost tracking
- ✅ Add/remove devices
- ✅ Toggle device states
- ✅ Real-time statistics
- ✅ Logout functionality

**Ready For:**
- 🔄 Backend API integration
- 🔄 Real device connectivity
- 🔄 Database persistence
- 🔄 Multi-user support
- 🔄 Containerization

---

**Your professional IoT management system is ready! 🎉**
