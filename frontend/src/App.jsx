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
import DashboardApp from './pages/DashboardApp';
import CashierPage from './pages/CashierPage';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
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
              fallbackRoute={['staff', 'kitchen'].includes(userRole) ? '/kitchen' : '/login'}
            />
          }
        >
          <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path="/admin/menu" element={<Navigate to="/admin?tab=menuqr" replace />} />
          <Route path="/admin/qr" element={<Navigate to="/admin?tab=menuqr" replace />} />
          <Route path="/staff" element={<DashboardApp />} />
          <Route path="/cashier" element={
            <div style={{minHeight: '100vh', background: '#f5f5f5'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', padding: '16px 24px', background: '#fff', borderBottom: '1px solid #ddd'}}>
                <h2 style={{margin: 0, color: '#e85d04', fontFamily: '"Times New Roman", Times, serif'}}>Giao Diện Thu Ngân</h2>
                <button onClick={handleLogout} style={{padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'}}>Đăng xuất</button>
              </div>
              <CashierPage />
            </div>
          } />
        </Route>

        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['admin', 'staff', 'kitchen']}
              userRole={userRole}
              fallbackRoute={['cashier'].includes(userRole) ? '/admin' : '/login'}
            />
          }
        >
          <Route path="/kitchen" element={<KitchenView onLogout={handleLogout} />} />
        </Route>

        <Route path="/table/:tableId" element={<Home onLogin={handleLogin} />} />
        <Route path="/table/:tableId/menu" element={<TableMenu />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
