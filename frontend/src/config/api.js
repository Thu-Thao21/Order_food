// API Configuration - Tập trung quản lý tất cả endpoints

const PRODUCTION_URL = 'https://vannthangg.onrender.com';

const getBaseUrl = () => {
  if (window.location.hostname === 'localhost') return 'http://localhost:3000';
  return PRODUCTION_URL;
};

export const SOCKET_URL = getBaseUrl();
export const API_BASE_URL = `${SOCKET_URL}/api`;

// ===== AUTH APIs =====
export const AUTH_API = {
  LOGIN: `${API_BASE_URL}/auth/login`,
};

// ===== CUSTOMER APIs (TableMenu, ScanQR) =====
export const CUSTOMER_API = {
  GET_TABLE_MENU: (tableId) => `${API_BASE_URL}/table/${tableId}/menu`,
  GET_TABLE_QR: (tableId) => `${API_BASE_URL}/table/${tableId}/qr`,
  PLACE_ORDER: `${API_BASE_URL}/order`,
};

// ===== ADMIN - ORDERS APIs (CashierPage, KitchenView) =====
export const ADMIN_ORDERS_API = {
  GET_PENDING_ORDERS: `${API_BASE_URL}/admin/orders/pending`,
  UPDATE_ORDER_STATUS: (orderId) => `${API_BASE_URL}/admin/order/${orderId}/status`,
  UPDATE_PAYMENT: (orderId) => `${API_BASE_URL}/orders/${orderId}/payment`,
};

// ===== ADMIN - MENU APIs (MenuManager, AdminDashboard) =====
export const ADMIN_MENU_API = {
  GET_ALL_MENU: `${API_BASE_URL}/admin/menu`,
  GET_CATEGORIES: `${API_BASE_URL}/admin/categories`,
  ADD_MENU_ITEM: `${API_BASE_URL}/admin/menu`,
  UPDATE_MENU_ITEM: (itemId) => `${API_BASE_URL}/admin/menu/${itemId}`,
  DELETE_MENU_ITEM: (itemId) => `${API_BASE_URL}/admin/menu/${itemId}`,
  UPDATE_AVAILABILITY: (itemId) => `${API_BASE_URL}/menu/${itemId}/availability`,
  UPLOAD_IMAGE: `${API_BASE_URL}/upload`,
};

// ===== ADMIN - USERS APIs (EmployeeManager, AdminApp) =====
export const ADMIN_USERS_API = {
  GET_ALL_USERS: `${API_BASE_URL}/admin/users`,
  CREATE_USER: `${API_BASE_URL}/admin/users`,
  UPDATE_USER: (userId) => `${API_BASE_URL}/admin/users/${userId}`,
  DELETE_USER: (userId) => `${API_BASE_URL}/admin/users/${userId}`,
};

// ===== ADMIN - TABLES APIs (QRCodeManager, ScanQR) =====
export const ADMIN_TABLES_API = {
  GET_ALL_TABLES: `${API_BASE_URL}/admin/tables`,
};

// ===== ADMIN - DASHBOARD APIs (AdminDashboard) =====
export const ADMIN_DASHBOARD_API = {
  GET_DAILY_REVENUE: `${API_BASE_URL}/admin/revenue/daily`,
  GET_REVENUE_SUMMARY: `${API_BASE_URL}/admin/revenue/summary`,
};

// ===== PAYMENT REQUEST APIs (Home, CashierPage) =====
export const PAYMENT_REQUEST_API = {
  GET_ALL: `${API_BASE_URL}/payment-requests`,
  CREATE: `${API_BASE_URL}/payment-requests`,
  UPDATE_STATUS: (id) => `${API_BASE_URL}/payment-requests/${id}`,
};

// ===== RATING APIs (Home, AdminDashboard) =====
export const RATING_API = {
  GET_ALL: `${API_BASE_URL}/ratings`,
  CREATE: `${API_BASE_URL}/ratings`,
  UPDATE_STATUS: (id) => `${API_BASE_URL}/ratings/${id}`,
};

// ===== STAFF CALL APIs (Home, CashierPage, AdminDashboard) =====
export const STAFF_CALL_API = {
  GET_ALL: `${API_BASE_URL}/staff-calls`,
  CREATE: `${API_BASE_URL}/staff-calls`,
  UPDATE_STATUS: (id) => `${API_BASE_URL}/staff-calls/${id}`,
};

// ===== API ENDPOINTS SUMMARY =====
export const API_ENDPOINTS = {
  // Authentication
  'POST /api/auth/login': 'Đăng nhập (username, password)',

  // Customer - Order
  'GET /api/table/:id/menu': 'Lấy menu của bàn',
  'GET /api/table/:id/qr': 'Lấy QR code của bàn',
  'POST /api/order': 'Đặt một đơn hàng (tableId, items, orderType)',

  // Admin - Orders
  'GET /api/admin/orders/pending': 'Lấy danh sách đơn chờ',
  'PATCH /api/admin/order/:id/status': 'Cập nhật trạng thái đơn (status)',
  'PUT /api/orders/:id/payment': 'Cập nhật thanh toán (paymentStatus, paymentMethod)',

  // Admin - Menu
  'GET /api/admin/menu': 'Lấy danh sách menu items',
  'GET /api/admin/categories': 'Lấy danh sách danh mục',
  'POST /api/admin/menu': 'Thêm menu item (name, price, categoryId, ...)',
  'PUT /api/admin/menu/:id': 'Chỉnh sửa menu item',
  'DELETE /api/admin/menu/:id': 'Xóa menu item',
  'PUT /api/menu/:id/availability': 'Cập nhật tính sẵn có (isAvailable)',
  'POST /api/upload': 'Upload ảnh menu item',

  // Admin - Users
  'GET /api/admin/users': 'Lấy danh sách users',
  'POST /api/admin/users': 'Tạo user (username, password, name, role)',
  'PUT /api/admin/users/:id': 'Cập nhật user',
  'DELETE /api/admin/users/:id': 'Xóa user',

  // Admin - Tables
  'GET /api/admin/tables': 'Lấy danh sách bàn',

  // Admin - Dashboard
  'GET /api/admin/revenue/daily': 'Lấy doanh thu hôm nay',
  'GET /api/admin/revenue/summary': 'Lấy tóm tắt doanh thu',
};

export default API_BASE_URL;
