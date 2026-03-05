# 🍕 Food Order System - SOA Backend

Complete Service-Oriented Architecture backend for a food delivery platform built with Node.js, Express, and SQLite.

## 📋 Project Structure

```
food-order-soa/
├── api-gateway/              # Entry point for all requests (Port 8080)
├── services/
│   ├── user-service/         # Authentication & user management (Port 3001)
│   ├── restaurant-service/   # Restaurant & menu management (Port 3002)
│   ├── order-service/        # Order processing (Port 3003)
│   └── notification-service/ # Notifications (Port 3004)
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Setup

```bash
# Clone the repository
cd food-order-soa

# Install dependencies for all services
cd api-gateway && npm install && cd ..
cd services/user-service && npm install && cd ../..
cd services/restaurant-service && npm install && cd ../..
cd services/order-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
```

### Environment Configuration

Copy `.env.example` to `.env` in each service directory:

```bash
# For each service:
cp services/user-service/.env.example services/user-service/.env
cp services/restaurant-service/.env.example services/restaurant-service/.env
cp services/order-service/.env.example services/order-service/.env
cp services/notification-service/.env.example services/notification-service/.env
cp api-gateway/.env.example api-gateway/.env
```

⚠️ **Important**: Make sure `JWT_SECRET` is the same in all services!

### Running the Services

**Option 1: Run all services concurrently (recommended for testing)**

Open 5 different terminal windows and run:

```bash
# Terminal 1 - API Gateway
cd api-gateway
npm start

# Terminal 2 - User Service
cd services/user-service
npm start

# Terminal 3 - Restaurant Service
cd services/restaurant-service
npm start

# Terminal 4 - Order Service
cd services/order-service
npm start

# Terminal 5 - Notification Service
cd services/notification-service
npm start
```

**Option 2: Using npm concurrently**

```bash
npm install -g concurrently

# From root directory (requires setup in main package.json)
concurrently \
  "cd api-gateway && npm start" \
  "cd services/user-service && npm start" \
  "cd services/restaurant-service && npm start" \
  "cd services/order-service && npm start" \
  "cd services/notification-service && npm start"
```

## 🔑 API Endpoints

### Authentication (via API Gateway: http://localhost:8080)

**Register User**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "role": "customer|owner|admin"
}
```

**Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "123456"
}
```

**Get Current User**
```
GET /api/users/me
Authorization: Bearer <token>
```

### Restaurants

**List Restaurants**
```
GET /api/restaurants
```

**Get Restaurant Details**
```
GET /api/restaurants/:id
```

**Get Restaurant Menu**
```
GET /api/restaurants/:id/menu
```

**Create Restaurant** (owner only)
```
POST /api/restaurants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Pizza Palace",
  "address": "123 Main St",
  "image_url": "https://..."
}
```

**Update Restaurant** (owner only)
```
PUT /api/restaurants/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "address": "456 New St",
  "status": "active|inactive",
  "image_url": "https://..."
}
```

### Menu Items

**Add Menu Item** (owner only)
```
POST /api/restaurants/:restaurantId/menu
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Margherita Pizza",
  "price": 12.99,
  "category": "Pizza",
  "available": true
}
```

**Update Menu Item** (owner only)
```
PUT /api/menu-items/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Pizza",
  "price": 14.99,
  "category": "Pizza",
  "available": true
}
```

**Toggle Menu Item Availability** (owner only)
```
PATCH /api/menu-items/:id/toggle
Authorization: Bearer <token>
```

### Orders

**Create Order** (customer only)
```
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "restaurantId": 1,
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ]
}
```

**Get My Orders** (customer)
```
GET /api/orders/my
Authorization: Bearer <token>
```

**Get Order Details**
```
GET /api/orders/:id
Authorization: Bearer <token>
```

**Cancel Order** (customer only)
```
PATCH /api/orders/:id/cancel
Authorization: Bearer <token>
```

**Get Restaurant Orders** (owner only)
```
GET /api/orders/restaurant/:restaurantId
Authorization: Bearer <token>
```

**Update Order Status** (owner only)
```
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed|preparing|ready|delivered|completed"
}
```

### Notifications

**Get Notifications**
```
GET /api/notifications
Authorization: Bearer <token>
```

**Mark Notification as Read**
```
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

**Get Unread Count**
```
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

## 🧪 Test Data

Default seed accounts created on first run:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | 123456 | admin |
| owner@example.com | 123456 | owner |
| customer@example.com | 123456 | customer |

Default restaurant: Pizza Palace with 3 menu items

## 📦 Technical Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT + bcryptjs
- **Service Communication**: HTTP/REST with axios
- **CORS**: Enabled for http://localhost:3000

## 🏗️ System Architecture

### Service Isolation
- Each service has its own SQLite database
- No direct database foreign keys between services
- Services communicate via HTTP APIs

### API Gateway
- Single entry point at port 8080
- JWT validation before routing
- Attaches user context headers to downstream requests
- Error handling and service availability checks

### Fault Tolerance
- Notification service failures don't block orders
- Service-to-service communication uses try/catch
- Graceful error responses

## 📝 Status Transitions

### Order Status Flow
```
pending → confirmed → preparing → ready → delivered → completed
   ↓
cancelled
```

## 🔐 Security

- Passwords hashed with bcryptjs (salt rounds: 10)
- JWT tokens expire in 24 hours
- Role-based access control (customer, owner, admin)
- Header validation for internal service calls

## 📊 Database Schemas

### Users
- id, name, email, password_hash, role, created_at

### Restaurants
- id, name, address, owner_id, status, image_url, created_at

### Menu Items
- id, restaurant_id, name, price, category, available, created_at

### Orders
- id, user_id, restaurant_id, status, total, created_at

### Order Items
- id, order_id, menu_item_id, quantity, price, created_at

### Notifications
- id, user_id, type, message, is_read, created_at

## 🐛 Troubleshooting

**Services not connecting?**
- Ensure all services are running
- Check port numbers in .env files
- Verify SERVICE_URLs match actual ports

**Database locked error?**
- Restart the service
- Check if multiple instances are running

**JWT errors?**
- Ensure JWT_SECRET is consistent across all services
- Verify token expiration (24 hours)

## 📚 Development

For development with auto-reload:

```bash
npm run dev  # in each service directory
```

## 🚢 Docker Support (Future)

Services can be containerized with Docker. Add Dockerfile to each service for production deployment.

## 📝 API Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error description"
}
```

## 📄 License

MIT

---

**Built with ❤️ for food ordering**
