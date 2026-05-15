import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ADMIN_ORDERS_API, ADMIN_MENU_API, SOCKET_URL, API_BASE_URL } from '../config/api';
import AdminLayout from '../components/AdminLayout';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    color: '#0f0e2e',
    padding: '24px',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: '18px',
    marginBottom: '28px'
  },
  heading: {
    margin: 0,
    fontSize: 'clamp(2rem, 2.5vw, 2.5rem)',
    lineHeight: 1.1,
    color: '#0f0e2e'
  },
  subtitle: {
    margin: 0,
    color: '#666',
    maxWidth: '720px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px'
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '260px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '22px',
    borderBottom: '1px solid #e5e5e5'
  },
  tableBadge: {
    background: '#ff8500',
    color: '#fff',
    borderRadius: '999px',
    padding: '8px 14px',
    fontWeight: 700,
    fontSize: '0.95rem'
  },
  statusTag: {
    color: '#ff8500',
    background: 'rgba(255, 133, 0, 0.1)',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '0.82rem',
    letterSpacing: '0.02em'
  },
  body: {
    padding: '18px 22px 22px'
  },
  time: {
    color: '#999',
    fontSize: '0.94rem',
    marginTop: '8px'
  },
  items: {
    listStyle: 'none',
    margin: '16px 0 0',
    padding: 0,
    display: 'grid',
    gap: '12px'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '14px 16px',
    background: '#f5f5f5',
    borderRadius: '8px'
  },
  itemName: {
    margin: 0,
    fontWeight: 600,
    color: '#0f0e2e'
  },
  itemQty: {
    margin: 0,
    color: '#ff8500',
    fontWeight: 700
  },
  button: {
    marginTop: 'auto',
    width: '100%',
    border: 'none',
    borderTop: '1px solid #e5e5e5',
    padding: '18px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #ff8500 0%, #ff7000 100%)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    transition: 'all 0.2s'
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    color: '#999'
  }
};

const formatTimeSince = (createdAt) => {
  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

export default function KitchenView({ onLogout }) {
  // Light theme only
  const pageBg = '#f5f5f5';
  const textMain = '#0f0e2e';
  const textMuted = '#666';
  const cardBg = '#fff';
  const cardBorder = '#e5e5e5';
  const itemRowBg = '#f5f5f5';
  const tabBorderColor = '#e5e5e5';

  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' hoặc 'inventory'
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    onLogout?.();
    navigate('/login');
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(ADMIN_ORDERS_API.GET_PENDING_ORDERS);
      setOrders(response.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Không thể tải đơn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedOrders = async () => {
    try {
      const [compRes, waitingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/orders/completed`),
        axios.get(`${API_BASE_URL}/admin/orders/waiting-payment`)
      ]);
      const combined = [...(compRes.data || []), ...(waitingRes.data || [])];
      // Sắp xếp giảm dần theo thời gian tạo
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCompletedOrders(combined);
    } catch (err) {
      console.error('Lỗi tải đơn đã hoàn thành:', err);
    }
  };

  const loadMenuItems = async () => {
    try {
      setInventoryLoading(true);
      const response = await axios.get(ADMIN_MENU_API.GET_ALL_MENU);
      setMenuItems(response.data || []);
    } catch (err) {
      console.error('Lỗi tải menu:', err);
      setError('Không thể tải danh sách món.');
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      setActionLoading(itemId);
      const newStatus = !currentStatus;
      const response = await axios.put(ADMIN_MENU_API.UPDATE_AVAILABILITY(itemId), {
        isAvailable: newStatus
      });

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: newStatus } : item
        )
      );

      console.log(response.data.message);
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
      setError('Cập nhật trạng thái thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    loadOrders();
    loadCompletedOrders();

    // Socket.io real-time updates
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Listen for new orders
    socket.on('new-order', (newOrder) => {
      console.log('📦 Đơn mới:', newOrder);
      setOrders((prev) => {
        if (prev.find(o => o.id === newOrder.id)) {
          return prev.map(o => o.id === newOrder.id ? newOrder : o);
        }
        return [newOrder, ...prev];
      });
    });

    // Listen for order status updates
    socket.on('order-status-update', (updatedOrder) => {
      console.log('🔄 Cập nhật đơn:', updatedOrder);
      const validStatuses = ['pending', 'Pending', 'Processing', 'processing', 'ready', 'Ready', 'cooking', 'Cooking'];
      if (validStatuses.includes(updatedOrder.status)) {
        // Update order if still in kitchen view
        setOrders((prev) =>
          prev.map((o) => o.id === updatedOrder.id ? updatedOrder : o)
        );
      } else {
        // Remove order if status changed to waiting_payment, completed, etc
        setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
        // Refresh completed orders if necessary
        if (updatedOrder.status === 'completed' || updatedOrder.status === 'waiting_payment') {
          loadCompletedOrders();
        }
      }
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket.io connection error:', error);
    });

    // Fallback: poll every 5 seconds
    const interval = setInterval(loadOrders, 5000);

    return () => {
      clearInterval(interval);
      socket.off('new-order');
      socket.off('order-status-update');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadMenuItems();
    } else if (activeTab === 'completed') {
      loadCompletedOrders();
    }
  }, [activeTab]);

  const handleMarkDone = async (orderId) => {
    try {
      setActionLoading(orderId);
      await axios.patch(ADMIN_ORDERS_API.UPDATE_ORDER_STATUS(orderId), { status: 'waiting_payment' });
      // Không filter local - để backend & Socket.io xử lý
    } catch (err) {
      console.error(err);
      setError('Cập nhật trạng thái thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const tabsContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '28px',
    borderBottom: '2px solid #e85d0420',
    paddingBottom: '0',
    overflowX: 'auto',
    fontFamily: '"Times New Roman", Times, serif'
  };

  const tabButtonStyle = (isActive) => ({
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    borderBottom: isActive ? '3px solid #e85d04' : '3px solid transparent',
    color: isActive ? '#e85d04' : '#999',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: isActive ? '700' : '600',
    transition: 'all 0.2s',
    marginBottom: '-2px',
    whiteSpace: 'nowrap',
    fontFamily: '"Times New Roman", Times, serif'
  });

  return (
    <AdminLayout title="Bếp" onLogout={handleLogout}>
      {/* Cập nhật trạng thái */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ color: textMuted, fontSize: '0.9rem' }}>Cập nhật tự động mỗi 5 giây</div>
        <div style={{ background: 'rgba(232, 93, 4, 0.1)', padding: '8px 16px', borderRadius: '8px', color: '#e85d04', fontWeight: 700, border: '1px solid #e85d0430' }}>
          Đơn đang chờ: {orders.length}
        </div>
      </div>

      <div style={tabsContainerStyle}>
        <button
          onClick={() => setActiveTab('orders')}
          style={tabButtonStyle(activeTab === 'orders')}
        >
          Đơn đang chờ ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={tabButtonStyle(activeTab === 'completed')}
        >
          Đã hoàn thành ({completedOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={tabButtonStyle(activeTab === 'inventory')}
        >
          Quản lý hàng
        </button>
      </div>

      {/* Tab: Đơn hàng */}
      {activeTab === 'orders' && (
        <>
          {loading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '100px' }}>Đang tải đơn...</div>
          ) : (
            <div style={styles.grid}>
              {orders.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: textMuted, padding: '60px 14px', border: `1px solid ${cardBorder}`, borderRadius: '24px' }}>
                  Hiện tại không có đơn chờ.
                </div>
              ) : (
                orders.filter(order => order.items.some(item => !item.isServed)).length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: textMuted, padding: '60px 14px', border: `1px solid ${cardBorder}`, borderRadius: '24px' }}>
                    Hiện tại không có đơn chờ.
                  </div>
                ) : (
                  orders.filter(order => order.items.some(item => !item.isServed)).map((order) => (
                    <article key={order.id} style={{ ...styles.card, background: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div style={styles.cardHeader}>
                      <div>
                        <div style={{ fontSize: '0.98rem', color: '#94a3b8' }}>{order.table?.name || `Bàn ${order.tableId}`}</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '6px' }}>#{order.id}</div>
                      </div>
                      <div style={styles.tableBadge}>{formatTimeSince(order.createdAt)}</div>
                    </div>

                    <div style={styles.body}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <span style={styles.statusTag}>{order.status?.toUpperCase() || 'PENDING'}</span>
                          <span style={{ ...styles.statusTag, background: order.orderType === 'dine-in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: order.orderType === 'dine-in' ? '#10b981' : '#8b5cf6' }}>
                            {order.orderType === 'dine-in' ? '🍽️ Ăn tại quán' : '🛍️ Mang về'}
                          </span>
                        </div>
                        <span style={styles.time}>{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>



                      <ul style={styles.items}>
                        {order.items.filter(item => !item.isServed).map((item) => (
                          <li key={item.id} style={{ ...styles.itemRow, background: itemRowBg, flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <p style={{ ...styles.itemName, color: textMain, margin: 0 }}>{item.menuItem?.name || 'Món không xác định'}</p>
                                <p style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0 0' }}>
                                  Order: {item.addedByUser ? item.addedByUser.name : 'Khách'}
                                </p>
                              </div>
                              <p style={{ ...styles.itemQty, margin: 0 }}>x{item.quantity}</p>
                            </div>
                            {item.note && (
                              <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#ef444410', padding: '6px 10px', borderRadius: '4px', fontStyle: 'italic', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                <span>⚠️</span> <span>{item.note}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      style={styles.button}
                      onClick={() => handleMarkDone(order.id)}
                      disabled={actionLoading === order.id}
                    >
                      {actionLoading === order.id ? 'Đang cập nhật...' : 'Đã phục vụ'}
                    </button>
                  </article>
                ))
              )
            )}
          </div>
        )}
        </>
      )}

      {/* Tab: Đã hoàn thành */}
      {activeTab === 'completed' && (
        <>
          <div style={styles.grid}>
            {completedOrders.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: textMuted, padding: '60px 14px', border: `1px solid ${cardBorder}`, borderRadius: '24px' }}>
                Không có đơn đã hoàn thành.
              </div>
            ) : (
              completedOrders.map((order) => (
                <article key={`comp-${order.id}`} style={{ ...styles.card, background: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div style={styles.cardHeader}>
                    <div>
                      <div style={{ fontSize: '0.98rem', color: '#94a3b8' }}>{order.table?.name || `Bàn ${order.tableId}`}</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '6px' }}>#{order.id}</div>
                    </div>
                    <div style={{ ...styles.tableBadge, background: '#10b981' }}>{formatTimeSince(order.createdAt)}</div>
                  </div>

                  <div style={styles.body}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ ...styles.statusTag, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>ĐÃ XONG</span>
                        <span style={{ ...styles.statusTag, background: order.orderType === 'dine-in' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: order.orderType === 'dine-in' ? '#10b981' : '#8b5cf6' }}>
                          {order.orderType === 'dine-in' ? '🍽️ Ăn tại quán' : '🛍️ Mang về'}
                        </span>
                      </div>
                      <span style={styles.time}>{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>



                    <ul style={styles.items}>
                      {order.items?.map((item) => (
                        <li key={`comp-item-${item.id}`} style={{ ...styles.itemRow, background: itemRowBg, flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ ...styles.itemName, color: textMain, margin: 0 }}>{item.menuItem?.name || 'Món không xác định'}</p>
                              <p style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0 0' }}>
                                Order: {item.addedByUser ? item.addedByUser.name : 'Khách'}
                              </p>
                            </div>
                            <p style={{ ...styles.itemQty, margin: 0 }}>x{item.quantity}</p>
                          </div>
                          {item.note && (
                            <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#ef444410', padding: '6px 10px', borderRadius: '4px', fontStyle: 'italic', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                              <span>⚠️</span> <span>{item.note}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}

      {/* Tab: Quản lý hàng */}
      {activeTab === 'inventory' && (
        <>
          {inventoryLoading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', marginTop: '100px' }}>Đang tải danh sách món...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {menuItems.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                  Không có món nào.
                </div>
              ) : (
                menuItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: item.isAvailable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: item.isAvailable ? '1.5px solid rgba(16, 185, 129, 0.3)' : '1.5px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, color: textMain, fontSize: '1.1rem', fontWeight: 700 }}>
                        {item.name}
                      </h3>
                      <p style={{ margin: '6px 0 0', color: textMuted, fontSize: '0.9rem' }}>
                        {item.category?.name || 'Không xác định'}
                      </p>
                      <p style={{ margin: '4px 0 0', color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>
                        {(item.price || 0).toLocaleString('vi-VN')} đ
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                      disabled={actionLoading === item.id}
                      style={{
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '12px',
                        background: item.isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: item.isAvailable ? '#6ee7b7' : '#fca5a5',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '120px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = item.isAvailable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = item.isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                      }}
                    >
                      {actionLoading === item.id ? (
                        'Đang...'
                      ) : item.isAvailable ? (
                        'Còn hàng'
                      ) : (
                        'Hết hàng'
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {error && <div style={styles.footer}>{error}</div>}
    </AdminLayout>
  );
}
