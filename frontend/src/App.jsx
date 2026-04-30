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

function ProtectedRoute({ isAuthenticated }) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function App() {
  // Lục tìm trong bộ nhớ xem có user không, nếu có thì là true, không có thì là false
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('user'));

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/scan" element={<ScanQR />} />
        <Route path="/kitchen" element={<KitchenView onLogout={handleLogout} />} />

        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/admin" element={<AdminDashboard onLogout={handleLogout} />} />
          <Route path="/admin/menu" element={<Navigate to="/admin?tab=menuqr" replace />} />
          <Route path="/admin/qr" element={<Navigate to="/admin?tab=menuqr" replace />} />
        </Route>

        <Route path="/table/:tableId" element={<Home onLogin={handleLogin} />} />
        <Route path="/table/:tableId/menu" element={<TableMenu />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
