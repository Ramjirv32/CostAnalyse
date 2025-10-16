# Docker Deployment Guide - IoT Manager

## 🐳 Docker Setup

Your IoT Manager app is now containerized and ready to run with Docker!

---

## 📋 Prerequisites

Install Docker:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

---

## 🚀 Build and Run

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and run in one command
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d --build

# Stop the container
docker-compose down
```

### Option 2: Using Docker Commands

```bash
# Build the image
docker build -t iot-manager .

# Run the container
docker run -it --rm \
  -e DISPLAY=:99 \
  -e ELECTRON_DISABLE_SANDBOX=1 \
  --name iot-manager-app \
  iot-manager

# Stop the container
docker stop iot-manager-app
```

---

## 🎬 Application Flow (When Running in Docker)

```
Docker Build Starts
    ↓
Stage 1: Build React App
    ↓
Stage 2: Setup Electron Runtime
    ↓
Container Starts
    ↓
Xvfb Display Server Starts
    ↓
Electron App Launches (1200x800)
    ↓
[1] Startup Screen (Build Progress)
    ├─ Initializing application
    ├─ Loading dependencies
    ├─ Configuring environment
    ├─ Starting services
    └─ Ready to launch
    ↓
[2] Welcome Screen (3 seconds)
    ├─ IoT Manager Logo
    ├─ Welcome Message
    └─ Loading Animation
    ↓
[3] Login Screen
    ├─ Email: dummy@gmail.com
    ├─ Password: dummy
    └─ Sign In Button
    ↓
[4] Dashboard
    ├─ Device Management
    ├─ Statistics
    └─ Charts
```

---

## 🎨 Startup Sequence Details

### 1. Startup Screen (Build Progress)
- **Duration**: ~8 seconds
- **Background**: White
- **Shows**:
  - Black package icon
  - "IoT Manager" title
  - Progress bar (0-100%)
  - 5 build steps with checkmarks
- **Theme**: Black text on white background

### 2. Welcome Screen
- **Duration**: 3 seconds
- **Background**: Black
- **Shows**:
  - White logo with Activity icon
  - "Welcome to IoT Manager"
  - Animated loading dots
  - "Redirecting to login..."
- **Theme**: White text on black background

### 3. Login Screen
- **Background**: White
- **Shows**:
  - Black lock icon
  - Login form with black borders
  - Demo credentials displayed
- **Theme**: Black text/borders on white

### 4. Dashboard
- **Background**: White
- **Header**: Black with white text
- **Theme**: Professional black & white only

---

## 🔄 Session Behavior

### First Launch (Fresh Container)
```
Startup → Welcome → Login → Dashboard
```

### Subsequent Refreshes (Same Session)
```
Login → Dashboard
(Startup/Welcome skipped)
```

### After Logout
```
Login Screen
(Startup/Welcome skipped)
```

### New Container/Session
```
Startup → Welcome → Login → Dashboard
(Full sequence again)
```

---

## 🎯 To Reset and See Full Startup Again

### Method 1: Restart Container
```bash
docker-compose down
docker-compose up --build
```

### Method 2: Clear Session Storage
In Electron DevTools console:
```javascript
sessionStorage.clear();
localStorage.clear();
location.reload();
```

---

## 📦 Docker Image Details

### Multi-Stage Build
- **Stage 1**: Builds React app with Vite
- **Stage 2**: Creates runtime with Electron

### Image Size Optimization
- Uses Alpine Linux (minimal)
- Production dependencies only
- Excludes dev files

### Included Components
- ✅ Node.js 18
- ✅ Chromium (for Electron)
- ✅ Xvfb (virtual display)
- ✅ Required system libraries
- ✅ Built React app
- ✅ Electron main/preload scripts

---

## 🔧 Environment Variables

```bash
ELECTRON_DISABLE_SANDBOX=1  # Required for Docker
DISPLAY=:99                  # Virtual display
```

---

## 📝 Files Created

```
frontend/
├── Dockerfile              # Multi-stage build config
├── docker-compose.yml      # Compose configuration
├── .dockerignore          # Exclude unnecessary files
└── DOCKER_GUIDE.md        # This guide
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs -f

# Check if port is in use
sudo lsof -i :5173
```

### Electron display issues
```bash
# Ensure Xvfb is running
docker exec -it iot-manager-app ps aux | grep Xvfb
```

### Build fails
```bash
# Clean build
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Can't see Electron window
- Electron runs headless in Docker with Xvfb
- For GUI, you'd need X11 forwarding (complex setup)
- Current setup is for server deployment

---

## 🚀 Production Deployment

For production, consider:

1. **Add Backend API**
   - Separate backend container
   - Database container
   - Network between services

2. **Environment Variables**
   - Use `.env` files
   - Secure credentials
   - API endpoints

3. **Volume Mounts**
   - Persist user data
   - Store device configs
   - Log files

4. **Health Checks**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:5173"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

---

## 📊 Current Theme (Black & White Only)

### Color Palette
- **Background**: White (#FFFFFF)
- **Text**: Black (#000000)
- **Borders**: Black (#000000)
- **Secondary Text**: Gray (#4B5563, #6B7280)
- **Hover States**: Gray (#F3F4F6, #E5E7EB)

### No Other Colors Used
- ❌ No blue, green, red, purple
- ✅ Only black, white, gray shades
- ✅ Professional enterprise look

---

## ✅ Summary

**What Happens When You Run Docker:**

1. 🔨 Docker builds the image (shows build logs)
2. 🚀 Container starts
3. 📦 Startup screen shows build progress (8s)
4. 👋 Welcome screen with logo (3s)
5. 🔐 Login screen appears
6. ✅ Enter credentials and access dashboard

**Theme**: Pure black and white throughout!

---

**Your IoT Manager is now containerized and ready! 🎉**
