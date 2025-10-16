# IoT Device Manager - Complete System

A professional, enterprise-grade IoT device management system with **black and white only** design, full backend integration, MongoDB database, and **WiFi device detection & control**.

---

## 🎯 System Overview

**Frontend**: React + Vite + TailwindCSS + Electron (Desktop App)
**Backend**: Node.js + Express + MongoDB + JWT Authentication
**Database**: MongoDB with user ownership and device tracking
**Theme**: Pure black and white (no colors)
**NEW**: 
- WiFi Device Detection & Control (ESP32 + Standalone WiFi devices)
- **Power Consumption Tracking** with Daily/Weekly/Monthly cost calculations
- **ESP32 Devices in Dashboard** with connected device monitoring
- **Real-time Power Flow** visualization and cost tracking

---

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install MongoDB
sudo apt-get install mongodb    # Ubuntu/Debian
# or
brew install mongodb-community  # macOS

# Start MongoDB
sudo systemctl start mongodb    # Linux
# or
brew services start mongodb-community  # macOS

# Verify MongoDB is running
mongosh --eval "db.adminCommand('ismaster')"
```

### 2. Setup & Run

```bash
# Clone and navigate to project
cd /path/to/proto

# Run automated setup (creates admin user, starts backend)
./setup.sh

# Or manually:
cd backend && npm install && npm run dev &
cd ../frontend && npm install && npm run dev

# Launch Electron app
cd frontend && npm run electron:dev
```

### 3. Login

**Credentials:**
```
Email: dummy@gmail.com
Password: dummy
```

### 4. Access WiFi Device Control

Click **"WiFi Devices"** button in the Dashboard header to:
- Scan for WiFi networks
- Discover ESP32 and standalone WiFi devices
- Pair and control devices
- See **WIFI_QUICKSTART.md** for detailed guide

### 5. Monitor Power & Costs

Dashboard now shows:
- **ESP32 devices** with all connected devices (by GPIO pin)
- **Real-time power consumption** for each device
- **Daily/Weekly/Monthly costs** at $0.20/kWh
- **Current power flow** across all devices
- See **POWER_TRACKING_QUICKSTART.md** for guide

---

## 🎨 Design Philosophy

### Black & White Only
- **Backgrounds**: Pure white (#FFFFFF)
- **Text & Borders**: Pure black (#000000)
- **Accents**: Gray shades for hierarchy
- **No Colors**: Zero blue, green, red, etc.

### Professional Features
- ✅ Enterprise-grade UI/UX
- ✅ High contrast for accessibility
- ✅ Clean, minimal design
- ✅ Consistent typography
- ✅ Bold visual hierarchy

---

## 📊 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Electron App  │    │   React/Vite    │    │   Express API   │
│   (Desktop UI)  │◄──►│   (Frontend)    │◄──►│   (Backend)     │
│                 │    │                 │    │                 │
│ • 1200x800      │    │ • Login/Auth    │    │ • JWT Auth      │
│ • Black/White   │    │ • Device CRUD   │    │ • Device API    │
│ • Real-time     │    │ • Charts        │    │ • MongoDB       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                       │
                              ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MongoDB       │    │   Docker        │
                       │   (Database)    │    │   (Container)   │
                       │                 │    │                 │
                       │ • Users         │    │ • Multi-stage   │
                       │ • Devices       │    │ • Production    │
                       │ • Usage Data    │    │ • Electron GUI  │
                       └─────────────────┘    └─────────────────┘
```

---

## 🔐 Authentication System

### JWT-Based Authentication
- **Token Storage**: localStorage (frontend)
- **Session Management**: Automatic token refresh
- **User Ownership**: All devices tied to authenticated user

### API Endpoints
```
POST /api/auth/login     - User login
POST /api/auth/register  - User registration
GET  /api/auth/me        - Get current user info
POST /api/auth/logout    - Logout (client-side)
```

---

## 📱 Device Management

### Custom Device Names
- ✅ **No Dropdown Selection**
- ✅ **Custom Text Input** for device names
- ✅ **User-defined naming** (e.g., "Living Room Light", "Kitchen Fan")

### Device Features
- **Power Rating**: Watts (user input)
- **Status**: Online/Offline tracking
- **Location**: Custom location assignment
- **Description**: Optional device description
- **User Ownership**: Each device belongs to authenticated user

### API Endpoints
```
GET    /api/devices           - Get user's devices
POST   /api/devices           - Create new device
GET    /api/devices/:id       - Get device details
PUT    /api/devices/:id       - Update device
DELETE /api/devices/:id       - Delete device
PATCH  /api/devices/:id/toggle - Toggle device status
POST   /api/devices/:id/usage - Add usage record
```

---

## 📈 Analytics & Monitoring

### Real-time Statistics
- **Active Devices**: Count of online devices
- **Current Power**: Total power consumption (kW)
- **Daily Cost**: Electricity cost tracking

### Data Visualization
- **Power Usage Chart**: 7-day line chart (black/white)
- **Cost Chart**: Daily cost bar chart (black/white)
- **Usage Records**: Historical consumption data

---

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  role: String (enum: 'user', 'admin'),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Device Model
```javascript
{
  name: String (required, user-defined),
  description: String (optional),
  userId: ObjectId (required, ownership),
  type: String (enum: device categories),
  powerRating: Number (watts, required),
  location: String (optional),
  status: String (enum: 'online', 'offline'),
  dailyUsage: [{ date, usage, cost }],
  totalUsage: Number,
  totalCost: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Application Flow

### First Time Setup
```
Electron App Starts
    ↓
Startup Screen (8s)
    ├─ Build Progress (0-100%)
    ├─ 5 build steps
    └─ White background, black elements
    ↓
Welcome Screen (3s)
    ├─ Black background
    ├─ White logo animation
    └─ "Welcome to IoT Manager"
    ↓
Login Screen
    ├─ White background
    ├─ Black form elements
    ├─ Demo credentials shown
    └─ Enter: dummy@gmail.com / dummy
    ↓
Dashboard
    ├─ Black header, white content
    ├─ Add custom devices
    ├─ Monitor power usage
    └─ View analytics
```

### Subsequent Sessions
```
Electron App Starts
    ↓
Check Authentication
    ├─ Token exists? → Dashboard
    └─ No token? → Login Screen
```

---

## 🐳 Docker Support

### Multi-stage Build
```bash
# Build and run
docker-compose up --build

# Or individually
docker build -t iot-manager .
docker run -it --rm \
  -e DISPLAY=:99 \
  -e ELECTRON_DISABLE_SANDBOX=1 \
  iot-manager
```

### Production Ready
- ✅ Alpine Linux base (minimal size)
- ✅ Electron runtime with Xvfb
- ✅ MongoDB connection ready
- ✅ Environment variables configured

---

## 🔧 API Improvements (As AI Thinking)

Based on intelligent analysis, here are the improvements I implemented:

### 1. **User-Centric Device Management**
- Each device belongs to authenticated user
- No shared devices between users
- Secure ownership validation

### 2. **Custom Device Naming**
- Removed restrictive dropdowns
- Allow any device name (e.g., "My Smart Bulb")
- More flexible than predefined categories

### 3. **Comprehensive Data Model**
- Power rating in watts (user input)
- Usage tracking with daily records
- Cost calculation per device
- Location and description fields

### 4. **Professional Authentication**
- JWT token-based auth
- Password hashing with bcrypt
- Session management
- Secure API endpoints

### 5. **Real-time Capabilities**
- Live device status updates
- Instant power consumption display
- Real-time cost calculations

### 6. **Enterprise Features**
- User roles (user/admin)
- Device ownership validation
- Comprehensive error handling
- Input validation and sanitization

### 7. **Scalable Architecture**
- RESTful API design
- MongoDB for flexible data storage
- Modular backend structure
- Environment-based configuration

---

## 🚀 Advanced Features (Future-Ready)

### Ready for Implementation
- **Real-time WebSocket updates**
- **Device scheduling and automation**
- **Energy optimization algorithms**
- **Multi-user device sharing**
- **Cloud synchronization**
- **Mobile app companion**
- **Voice control integration**
- **AI-powered energy predictions**
- **Advanced analytics dashboard**
- **Alert and notification system**

---

## 📁 Project Structure

```
proto/
├── frontend/              # React + Electron App
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StartupScreen.jsx    # Build progress
│   │   │   ├── WelcomeScreen.jsx    # Welcome animation
│   │   │   ├── LoginScreen.jsx      # Authentication
│   │   │   └── Dashboard.jsx        # Main interface
│   │   └── App.jsx                  # App routing
│   ├── main.cjs                     # Electron main
│   ├── preload.cjs                  # Electron preload
│   ├── Dockerfile                   # Docker config
│   └── package.json
│
├── backend/               # Express + MongoDB API
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   └── Device.js                # Device schema
│   ├── routes/
│   │   ├── auth.js                  # Auth endpoints
│   │   ├── devices.js               # Device endpoints
│   │   └── users.js                 # User endpoints
│   ├── middleware/
│   │   └── auth.js                  # JWT middleware
│   ├── server.js                    # Express server
│   └── package.json
│
├── setup.sh              # Automated setup script
├── README.md             # This file
└── .gitignore
```

---

## 🔧 Configuration

### Environment Variables (Backend)
```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/iot-manager
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
```

### Frontend Configuration
- **API Base URL**: `http://localhost:5000/api`
- **Electron Window**: 1200×800 pixels
- **Theme**: Black and white only

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Login with valid credentials
- [ ] Add custom device with name and power
- [ ] Toggle device status (online/offline)
- [ ] View power usage charts
- [ ] Delete device
- [ ] Logout and login again
- [ ] Check device ownership (user-specific)

### API Testing
```bash
# Get all devices (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/devices

# Add new device
curl -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "powerRating": 60,
    "description": "Main living room lighting"
  }'
```

---

## 🔒 Security Features

- ✅ **JWT Authentication** with secure token storage
- ✅ **Password Hashing** using bcrypt (12 rounds)
- ✅ **Input Validation** and sanitization
- ✅ **Rate Limiting** (100 requests/15min per IP)
- ✅ **CORS Configuration** for frontend communication
- ✅ **Helmet Security** headers
- ✅ **User Ownership** validation for all operations

---

## 📊 Performance Optimizations

- ✅ **Database Indexing** on frequently queried fields
- ✅ **Efficient Queries** with user filtering
- ✅ **Minimal Frontend Bundle** size
- ✅ **Optimized Docker Images** (multi-stage build)
- ✅ **Connection Pooling** for MongoDB
- ✅ **Error Handling** with proper HTTP status codes

---

## 🚨 Troubleshooting

### Common Issues

**"MongoDB connection failed"**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**"Backend won't start"**
```bash
# Check if port 5000 is free
sudo lsof -i :5000

# Kill conflicting process
sudo kill -9 <PID>

# Or change backend port in .env
PORT=5001
```

**"Frontend can't connect to backend"**
```bash
# Check backend is running
curl http://localhost:5000/health

# Check CORS configuration
# Ensure FRONTEND_URL in .env includes your frontend URL
```

**"Devices not saving"**
```bash
# Check MongoDB connection
cd backend && node -e "require('./server.js')"

# Verify user authentication
# Check browser DevTools > Application > Local Storage
```

---

## 📈 Future Enhancements (AI Suggestions)

### Immediate (High Priority)
1. **Real-time WebSocket Updates** - Live device status changes
2. **Device Scheduling** - Automated on/off schedules
3. **Energy Optimization** - AI-powered usage recommendations
4. **Mobile App** - React Native companion app

### Medium Priority
1. **Advanced Analytics** - Trend analysis and predictions
2. **Multi-user Support** - Device sharing and permissions
3. **Cloud Sync** - Cross-device data synchronization
4. **Voice Control** - Alexa/Google Home integration

### Long-term Vision
1. **AI Energy Management** - Machine learning for optimal usage
2. **Blockchain Integration** - Secure device ownership records
3. **IoT Marketplace** - Device sharing and rental platform
4. **Global Dashboard** - Multi-location device management

---

## 📚 Documentation

- **Frontend Guide**: `frontend/APP_GUIDE.md`
- **Backend API**: `backend/README.md` (auto-generated)
- **Docker Guide**: `frontend/DOCKER_GUIDE.md`
- **Setup Script**: `setup.sh` (automated installation)

---

## 🤝 Contributing

### Development Workflow
1. **Backend Changes**: Update API endpoints in `backend/routes/`
2. **Frontend Changes**: Modify React components in `frontend/src/`
3. **Database Changes**: Update schemas in `backend/models/`
4. **Testing**: Test both frontend and API functionality

### Code Standards
- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional commit format
- **PR Reviews**: Required for all changes

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **React Team** for the excellent frontend framework
- **MongoDB Team** for the flexible document database
- **Express Team** for the robust backend framework
- **Electron Team** for cross-platform desktop apps
- **TailwindCSS** for utility-first styling

---

**🎉 Your IoT Device Manager is production-ready!**

**Next Steps:**
1. Run `./setup.sh` to start the system
2. Login with `dummy@gmail.com` / `dummy`
3. Add your first custom device
4. Monitor power usage and costs
5. Explore the black & white professional interface

**Ready for enterprise deployment! 🚀**
# CostAnalyse
