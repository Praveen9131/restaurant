import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Loading from './components/common/Loading';
import ProfileIcon from './components/common/ProfileIcon';
import ProductionErrorBoundary from './components/common/ProductionErrorBoundary';
// import AuthDebug from './components/common/AuthDebug'; // Development only

// Customer Pages
import Home from './pages/customer/Home';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import About from './pages/customer/About';
import Gallery from './pages/customer/Gallery';
import Contact from './pages/customer/Contact';
import Login from './pages/customer/Login';
import Signup from './pages/customer/Signup';
import ForgotPassword from './pages/customer/ForgotPassword';
import ResetPassword from './pages/customer/ResetPassword';
import ChangePassword from './pages/customer/ChangePassword';
import Profile from './pages/customer/Profile';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import OrdersManagement from './pages/admin/OrdersManagement';
import MenuManagement from './pages/admin/MenuManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import InquiriesManagement from './pages/admin/InquiriesManagement';
import APIDebug from './pages/admin/APIDebug';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to={requireAdmin ? '/admin/login' : '/login'} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/admin/login" />;
  }

  return children;
};

// Customer Route Component - Redirects admins to admin panel
const CustomerRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  // If user is admin, redirect to admin dashboard
  if (user && isAdmin) {
    console.log('Admin user detected, redirecting to admin panel');
    return <Navigate to="/admin" replace />;
  }

  // Allow customers and non-logged-in users to access customer pages
  return children;
};

// Layout wrapper
const Layout = ({ children, hideFooter = false }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
};

function App() {
  return (
    <ProductionErrorBoundary>
      <Router>
        <NotificationProvider>
          <AuthProvider>
            <CartProvider>
              {/* <AuthDebug /> */} {/* Development only */}
              <Routes>
            {/* Customer Routes - Redirect admins to admin panel */}
            <Route path="/" element={<CustomerRoute><Layout><Home /></Layout></CustomerRoute>} />
            <Route path="/menu" element={<CustomerRoute><Layout hideFooter={true}><Menu /></Layout></CustomerRoute>} />
            <Route path="/cart" element={<CustomerRoute><Layout><Cart /></Layout></CustomerRoute>} />
            <Route path="/about" element={<CustomerRoute><Layout><About /></Layout></CustomerRoute>} />
            <Route path="/gallery" element={<CustomerRoute><Layout><Gallery /></Layout></CustomerRoute>} />
            <Route path="/contact" element={<CustomerRoute><Layout><Contact /></Layout></CustomerRoute>} />
            <Route path="/login" element={<CustomerRoute><Layout><Login /></Layout></CustomerRoute>} />
            <Route path="/signup" element={<CustomerRoute><Layout><Signup /></Layout></CustomerRoute>} />
            <Route path="/forgot-password" element={<CustomerRoute><Layout><ForgotPassword /></Layout></CustomerRoute>} />
            <Route path="/reset-password" element={<CustomerRoute><Layout><ResetPassword /></Layout></CustomerRoute>} />
            <Route 
              path="/change-password" 
              element={
                <CustomerRoute>
                  <Layout>
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  </Layout>
                </CustomerRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <CustomerRoute>
                  <Layout>
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  </Layout>
                </CustomerRoute>
              } 
            />
            
            <Route
              path="/checkout"
              element={
                <CustomerRoute>
                  <Layout>
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  </Layout>
                </CustomerRoute>
              }
            />
            
            <Route
              path="/orders"
              element={
                <CustomerRoute>
                  <Layout>
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  </Layout>
                </CustomerRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/debug" element={<APIDebug />} />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="inquiries" element={<InquiriesManagement />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </NotificationProvider>
      </Router>
    </ProductionErrorBoundary>
  );
}

export default App;
