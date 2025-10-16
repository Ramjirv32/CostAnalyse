# IoT Manager Backend API

A robust Node.js/Express backend with MongoDB for the IoT Device Manager application.

## 🚀 Features

- **JWT Authentication** with secure token management
- **User Management** with role-based access control
- **Device CRUD Operations** with ownership validation
- **MongoDB Integration** with optimized schemas
- **RESTful API Design** with comprehensive endpoints
- **Input Validation** and error handling
- **Rate Limiting** and security middleware
- **Comprehensive Logging** with Morgan

## 📋 Prerequisites

- Node.js 18+
- MongoDB 4.4+ (or Docker)
- npm or yarn

## 🛠️ Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/iot-manager

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🚀 Running

### Development
```bash
npm run dev    # With nodemon for hot reload
```

### Production
```bash
npm start      # Production mode
```

The server will start on `http://localhost:5000`

## 📊 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | User login | ❌ |
| GET | `/me` | Get current user | ✅ |
| POST | `/logout` | Logout user | ❌ |

### Device Routes (`/api/devices`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all user's devices | ✅ |
| GET | `/:id` | Get specific device | ✅ |
| POST | `/` | Create new device | ✅ |
| PUT | `/:id` | Update device | ✅ |
| DELETE | `/:id` | Delete device | ✅ |
| PATCH | `/:id/toggle` | Toggle device status | ✅ |
| POST | `/:id/usage` | Add usage record | ✅ |
| GET | `/:id/stats` | Get device statistics | ✅ |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/profile` | Get user profile | ✅ | ❌ |
| PUT | `/profile` | Update profile | ✅ | ❌ |
| PUT | `/password` | Change password | ✅ | ❌ |
| GET | `/` | Get all users | ✅ | ✅ |
| GET | `/:id` | Get user by ID | ✅ | ✅ |
| PUT | `/:id` | Update user | ✅ | ✅ |
| DELETE | `/:id` | Delete user | ✅ | ✅ |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

### Register/Login Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### Using the Token
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/devices
```

## 📝 API Examples

### Create Device
```bash
curl -X POST http://localhost:5000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Living Room Light",
    "powerRating": 60,
    "description": "Main living room lighting",
    "location": "Living Room"
  }'
```

### Get Devices
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/devices
```

### Toggle Device
```bash
curl -X PATCH http://localhost:5000/api/devices/DEVICE_ID/toggle \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🗄️ Database Models

### User Model
```javascript
{
  email: String (unique, required),
  password: String (hashed),
  name: String (required),
  role: String (enum: ['user', 'admin']),
  isActive: Boolean,
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
  userId: ObjectId (required),
  type: String (enum: device types),
  powerRating: Number (watts),
  location: String (optional),
  status: String (enum: ['online', 'offline']),
  dailyUsage: [{ date, usage, cost }],
  totalUsage: Number,
  totalCost: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcrypt (12 rounds)
- **Input Validation** and sanitization
- **Rate Limiting** (100 requests/15min per IP)
- **CORS Configuration** for frontend communication
- **Helmet Security** headers
- **User Ownership** validation for all operations
- **Error Handling** without information leakage

## 🚨 Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details" // Optional
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## 📊 Monitoring

### Health Check Endpoint
```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

### Logging
- **Morgan**: HTTP request logging
- **Console**: Application events and errors
- **Structured Logging**: JSON format in production

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://production-server/iot-manager
JWT_SECRET=your-production-secret-key
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Or individually
docker build -t iot-manager-backend .
docker run -d \
  -e MONGODB_URI=mongodb://mongo:27017/iot-manager \
  -e JWT_SECRET=your-secret \
  --network iot-network \
  iot-manager-backend
```

## 📁 Project Structure

```
backend/
├── models/
│   ├── User.js           # User schema and methods
│   └── Device.js         # Device schema and methods
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── devices.js        # Device CRUD operations
│   └── users.js          # User management
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── server.js             # Express server setup
├── package.json
├── .env                  # Environment configuration
└── README.md             # This file
```

## 🔧 Development

### Adding New Routes
1. Create route file in `routes/`
2. Import and use in `server.js`
3. Add authentication middleware as needed

### Adding New Models
1. Create model in `models/`
2. Define schema with validation
3. Add indexes for performance
4. Export the model

### Database Operations
```javascript
// Example: Find user's devices
const devices = await Device.findByUser(userId);

// Example: Update device status
await device.updateStatus('online');

// Example: Add usage record
await device.addUsageRecord(usage, cost);
```

## 📈 Performance

- **Database Indexes**: Optimized queries with compound indexes
- **Connection Pooling**: Efficient MongoDB connections
- **Query Optimization**: Minimal data fetching
- **Caching**: Ready for Redis integration
- **Rate Limiting**: Prevents abuse

## 🔍 API Documentation

### Device Operations

#### Create Device
```javascript
POST /api/devices
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Living Room Light",
  "powerRating": 60,
  "description": "Main living room lighting",
  "location": "Living Room",
  "type": "light"
}
```

#### Get Devices
```javascript
GET /api/devices
Authorization: Bearer TOKEN
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "device_id",
      "name": "Living Room Light",
      "powerRating": 60,
      "status": "online",
      "location": "Living Room",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

## 🚨 Troubleshooting

### Common Issues

**"MongoDB connection failed"**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity

**"JWT token expired"**
- Implement token refresh logic in frontend
- Check token expiration time (currently 7 days)

**"Validation errors"**
- Check request body format
- Ensure required fields are provided
- Validate data types

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

This enables detailed error messages and request logging.

## 📝 Contributing

1. Follow RESTful API conventions
2. Add proper error handling
3. Include input validation
4. Write tests for new endpoints
5. Update documentation

## 📄 License

MIT License - See main project LICENSE file

---

**Backend API ready for production! 🚀**
