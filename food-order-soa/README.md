# Food Order SOA System

A Service-Oriented Architecture (SOA) backend for an online food ordering system built with Node.js, Express.js, and SQLite.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway :8080                        │
│              (JWT verification + request proxying)              │
└──────────┬──────────┬──────────────┬────────────────────────────┘
           │          │              │                │
           ▼          ▼              ▼                ▼
   user-service  restaurant-service  order-service  notification-service
      :3001           :3002             :3003            :3004
   (SQLite)        (SQLite)          (SQLite)          (SQLite)
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| api-gateway | 8080 | Entry point, JWT auth, reverse proxy |
| user-service | 3001 | Registration, login, JWT issuance |
| restaurant-service | 3002 | Restaurant & menu management |
| order-service | 3003 | Order placement & tracking |
| notification-service | 3004 | User notifications |

## Quick Start

### Install dependencies for all services

```bash
cd food-order-soa

# API Gateway
cd api-gateway && npm install && cd ..

# Services
cd services/user-service && npm install && cd ../..
cd services/restaurant-service && npm install && cd ../..
cd services/order-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
```

### Set up environment variables

Copy `.env.example` to `.env` in each service directory and update `JWT_SECRET` (must be the same for api-gateway and user-service).

```bash
cp api-gateway/.env.example api-gateway/.env
cp services/user-service/.env.example services/user-service/.env
cp services/restaurant-service/.env.example services/restaurant-service/.env
cp services/order-service/.env.example services/order-service/.env
cp services/notification-service/.env.example services/notification-service/.env
```

### Start all services (separate terminals)

```bash
# Terminal 1
cd food-order-soa/services/user-service && npm start

# Terminal 2
cd food-order-soa/services/restaurant-service && npm start

# Terminal 3
cd food-order-soa/services/order-service && npm start

# Terminal 4
cd food-order-soa/services/notification-service && npm start

# Terminal 5
cd food-order-soa/api-gateway && npm start
```

## API Reference

All requests go through the API Gateway at `http://localhost:8080`.

### Authentication (no JWT required)

```
POST /api/auth/register  { name, email, password, role }
POST /api/auth/login     { email, password }
```

### Users (JWT required)

```
GET  /api/users/me
```

### Restaurants (JWT required)

```
GET    /api/restaurants
GET    /api/restaurants/:id
GET    /api/restaurants/:id/menu
POST   /api/restaurants            (owner only)
PUT    /api/restaurants/:id        (owner only)
POST   /api/restaurants/:id/menu   (owner only)
PUT    /api/menu-items/:id         (owner only)
PATCH  /api/menu-items/:id/toggle  (owner only)
```

### Orders (JWT required)

```
POST   /api/orders                          (customer only)
GET    /api/orders/my
GET    /api/orders/:id
PATCH  /api/orders/:id/cancel               (customer only)
GET    /api/orders/restaurant/:restaurantId (owner only)
PATCH  /api/orders/:id/status               (owner only)
```

### Notifications (JWT required)

```
GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
```

## Demo Credentials

After first start, seed data is automatically inserted:

| Email | Password | Role |
|-------|----------|------|
| customer@example.com | customer123 | customer |
| owner@example.com | owner123 | owner |

## Response Format

Success:
```json
{ "success": true, "data": { ... } }
```

Error:
```json
{ "success": false, "error": "Description of the error" }
```
