import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation
} from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import KitchenView from './pages/KitchenView';
import TableMenu from './pages/TableMenu';
import ScanQR from './pages/ScanQR';
import MenuManager from './pages/MenuManager';
import QRCodeManager from './pages/QRCodeManager';
import AdminMenuQR from './pages/AdminMenuQR';
import StaffView from './pages/StaffView';

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

function ProtectedRoute({ isAuthenticated, allowedRoles = [], userRole, fallbackRoute = '/login' }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes((userRole || '').toLowerCase())) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
}

function App() {
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const isAuthenticated = !!currentUser;
  const userRole = (currentUser?.role || '').toLowerCase();

  const handleLogin = (user) => {
    setCurrentUser(user || getStoredUser());
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/scan" element={<ScanQR />} />

        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'cashier']}
              userRole={userRole}
              fallbackRoute={userRole === 'staff' ? '/staff' : userRole === 'kitchen' ? '/kitchen' : '/login'}
            />
          }
        >
          <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path="/admin/menu" element={<Navigate to="/admin?tab=menuqr" replace />} />
          <Route path="/admin/qr" element={<Navigate to="/admin?tab=menuqr" replace />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'kitchen']}
              userRole={userRole}
              fallbackRoute={userRole === 'staff' ? '/staff' : ['cashier'].includes(userRole) ? '/admin' : '/login'}
            />
          }
        >
          <Route path="/kitchen" element={<KitchenView onLogout={handleLogout} />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'staff']}
              userRole={userRole}
              fallbackRoute={userRole === 'kitchen' ? '/kitchen' : ['cashier'].includes(userRole) ? '/admin' : '/login'}
            />
          }
        >
          <Route path="/staff" element={<StaffView onLogout={handleLogout} />} />
        </Route>

        <Route path="/table/:tableId" element={<Home onLogin={handleLogin} />} />
        <Route path="/table/:tableId/menu" element={<TableMenu />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
