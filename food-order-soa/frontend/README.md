# Food Order Frontend - React SPA

This is a complete React Single Page Application (SPA) built with Vite for the Food Order System. It provides customer and owner interfaces for browsing restaurants, managing orders, and more.

## Features

### Customer Features
- ✅ User registration and authentication
- ✅ Browse restaurants with responsive grid
- ✅ View restaurant menus grouped by category
- ✅ Shopping cart with multi-item support
- ✅ Place orders with delivery address
- ✅ View order history with status tracking
- ✅ Real-time notification polling (30s interval)
- ✅ Order status timeline visualization

### Owner Features
- ✅ Create and manage restaurants
- ✅ Add/manage menu items with prices and categories
- ✅ Toggle menu item availability
- ✅ View all orders for owned restaurants
- ✅ Filter orders by status
- ✅ Update order status through workflow (pending → confirmed → preparing → ready → delivered → completed)
- ✅ Dashboard with pending order count

## Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Routing:** React Router v6
- **State Management:** Context API (AuthContext, CartContext)
- **HTTP Client:** Axios with interceptors
- **UI Components:** Custom components (Button, Badge, Spinner, Toast)

## Project Structure

```
frontend/
├── src/
│   ├── api/                  # API client layer
│   │   ├── axios.js         # Axios instance with interceptors
│   │   ├── authApi.js       # Authentication endpoints
│   │   ├── restaurantApi.js # Restaurant & menu endpoints
│   │   ├── orderApi.js      # Order endpoints
│   │   └── notificationApi.js # Notification endpoints
│   │
│   ├── context/             # State management
│   │   ├── AuthContext.jsx  # User authentication state
│   │   └── CartContext.jsx  # Shopping cart state
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Access AuthContext
│   │   └── useNotifications.js # Fetch notifications with polling
│   │
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.jsx   # Button with variants
│   │   │   ├── Badge.jsx    # Status badge
│   │   │   ├── Spinner.jsx  # Loading spinner
│   │   │   └── Toast.jsx    # Toast notification
│   │   ├── order/
│   │   │   └── OrderStatusBadge.jsx
│   │   └── layout/
│   │       ├── Navbar.jsx   # Navigation bar
│   │       └── ProtectedRoute.jsx # Role-based route protection
│   │
│   ├── pages/               # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── customer/
│   │   │   ├── HomePage.jsx
│   │   │   ├── RestaurantPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── OrdersPage.jsx
│   │   │   └── OrderDetailPage.jsx
│   │   ├── owner/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── MenuManagerPage.jsx
│   │   │   └── OrderManagerPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles with TailwindCSS
│
├── index.html               # HTML entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env                     # Environment variables
├── .env.example
├── .gitignore
└── README.md
```

## Installation & Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Update API URL (ensure backend is running on port 8080)
# VITE_API_URL=http://localhost:8080/api
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint with ESLint (if configured)
npm run lint
```

## API Integration

The frontend communicates with the backend API Gateway at `http://localhost:8080/api`

### Key API Endpoints

**Authentication:**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

**Restaurants:**
- `GET /restaurants` - List all restaurants
- `GET /restaurants/:id` - Get restaurant details
- `GET /restaurants/:id/menu` - Get restaurant menu

**Orders:**
- `POST /orders` - Create order
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/cancel` - Cancel order
- `PATCH /orders/:id/status` - Update order status (owner only)

**Notifications:**
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `POST /notifications/:id/read` - Mark notification as read

## Testing

### Test Accounts

**Customer:**
- Email: `customer@example.com`
- Password: `123456`

**Owner:**
- Email: `owner@example.com`
- Password: `123456`

**Admin:**
- Email: `admin@example.com`
- Password: `123456`

### Manual Testing Flow

1. **Login** as customer
2. **Browse restaurants** on home page
3. **View restaurant menu** with items grouped by category
4. **Add items to cart** with quantity controls
5. **Proceed to checkout** with delivery address
6. **Place order** and see confirmation
7. **View order status** with timeline visualization
8. **Switch to owner role** (logout and login as owner@example.com)
9. **Manage menu items** (add, edit, toggle availability)
10. **Process orders** (update status through workflow)

## State Management

### AuthContext
- Manages user authentication state
- Stores token and user info in localStorage
- Auto-logout on 401 responses
- Provides: `user`, `token`, `login()`, `logout()`, `isLoading`

### CartContext
- Manages shopping cart state
- Enforces single-restaurant constraint with confirmation
- Computed totals (amount, item count)
- Provides: `items`, `restaurantId`, `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`

## Interceptors

The Axios instance includes:

1. **Request Interceptor:** Auto-injects Bearer token from localStorage
2. **Response Interceptor:** Catches 401 errors and redirects to login

## Styling

- **TailwindCSS:** Utility-first CSS framework
- **Colors:** Red (#ef4444) as primary color
- **Responsive:** Mobile-first design with breakpoints
- **Components:** Custom UI library with consistent design

## Error Handling

- API errors show Toast notifications
- 401 Unauthorized redirects to login
- Form validation before submission
- Loading states with Spinner component
- Graceful empty states

## Performance

- **Code Splitting:** Route-based lazy loading (built-in with React Router)
- **Polling:** Notifications use 30s interval (only when logged in)
- **Caching:** Context API caches user and cart state
- **Optimization:** TailwindCSS purges unused styles in production

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

**Port 3000 already in use:**
```bash
# Change port in vite.config.js or run on different port
npm run dev -- --port 3001
```

**CORS errors:**
- Ensure backend is running on port 8080
- Check VITE_API_URL in .env

**Token not persisting:**
- Check localStorage in browser DevTools
- Clear localStorage and re-login

**Notifications not updating:**
- Polling only runs when user is logged in
- Check browser console for API errors

## Next Steps

- Add unit tests (Jest + React Testing Library)
- Add E2E tests (Cypress/Playwright)
- Deploy to production (Vercel, Netlify, etc.)
- Add image upload for restaurants/menu items
- Add payment integration
- Add real-time updates (WebSockets)

## Support

For issues or questions, check the main project README in the root directory.
