#!/bin/bash

# IoT Manager Setup Script

echo "🚀 Setting up IoT Manager..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   sudo systemctl start mongodb"
    echo "   # or"
    echo "   brew services start mongodb/brew/mongodb-community"
    echo ""
    echo "Alternatively, you can run MongoDB in a Docker container:"
    echo "   docker run -d -p 27017:27017 --name mongodb mongo:latest"
    echo ""
    exit 1
fi

echo "✅ MongoDB is running"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Start backend server
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Create initial admin user
echo "👤 Creating initial admin user..."
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dummy@gmail.com",
    "password": "dummy",
    "name": "Admin User"
  }' > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Admin user created successfully"
else
    echo "ℹ️  Admin user may already exist"
fi

echo ""
echo "🎉 IoT Manager is ready!"
echo ""
echo "📋 To start the application:"
echo ""
echo "Terminal 1 - Backend (already running):"
echo "   cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "Terminal 3 - Electron App:"
echo "   cd frontend && npm run electron:dev"
echo ""
echo "🔐 Login Credentials:"
echo "   Email: dummy@gmail.com"
echo "   Password: dummy"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Electron: Desktop application window"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 Documentation:"
echo "   Frontend Guide: frontend/APP_GUIDE.md"
echo "   Backend Guide: backend/README.md"
echo "   Docker Guide: frontend/DOCKER_GUIDE.md"
echo ""

# Wait for user to press Enter before exiting
read -p "Press Enter to continue..."
