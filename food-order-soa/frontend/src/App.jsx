// filepath: src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { Navbar } from './components/layout/Navbar'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

// Customer Pages
import { HomePage } from './pages/customer/HomePage'
import { RestaurantPage } from './pages/customer/RestaurantPage'
import { CartPage } from './pages/customer/CartPage'
import { OrdersPage } from './pages/customer/OrdersPage'
import { OrderDetailPage } from './pages/customer/OrderDetailPage'

// Owner Pages
import { DashboardPage } from './pages/owner/DashboardPage'
import { MenuManagerPage } from './pages/owner/MenuManagerPage'
import { OrderManagerPage } from './pages/owner/OrderManagerPage'

// Shared Pages
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurants/:id" element={<RestaurantPage />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute requiredRole="customer">
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute requiredRole="customer">
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute requiredRole="customer">
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Owner Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="owner">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/menu"
              element={
                <ProtectedRoute requiredRole="owner">
                  <MenuManagerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/orders"
              element={
                <ProtectedRoute requiredRole="owner">
                  <OrderManagerPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
