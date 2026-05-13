import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LogOut, Bell, CreditCard, ChevronRight, X, DollarSign, Check } from 'lucide-react';
import { PAYMENT_REQUEST_API, STAFF_CALL_API, SOCKET_URL, API_BASE_URL } from '../config/api';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
  },
  header: {
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    color: '#fff',
    padding: '16px 20px',
    boxShadow: '0 4px 12px rgba(232, 93, 4, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoutBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  },
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  section: {
    background: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  sectionTitle: {
    color: '#e85d04',
    margin: '0 0 16px 0',
    fontSize: '1.2rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '12px'
  },
  tableBtn: {
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#0f0e2e',
    fontWeight: 700,
    fontSize: '1rem'
  },
  tableBtnHover: {
    borderColor: '#e85d04',
    background: '#fff3eb',
    transform: 'translateY(-2px)'
  },
  requestList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  requestItem: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '12px',
    background: '#fafafa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  requestInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  actionBtn: {
    padding: '8px 16px',
    background: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '2px solid #e2e8f0'
  },
  tabBtn: {
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#999',
    fontSize: '0.95rem',
    transition: 'all 0.2s'
  },
  tabBtnActive: {
    color: '#e85d04',
    borderBottomColor: '#e85d04'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 100
  },
  modalContent: {
    background: '#fff',
    width: '100%',
    maxHeight: '90vh',
    borderRadius: '16px 16px 0 0',
    padding: '20px',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    boxSizing: 'border-box'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee'
  },
  paymentMethodGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px'
  },
  paymentMethod: {
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  },
  paymentMethodActive: {
    borderColor: '#e85d04',
    background: '#fff3eb',
    color: '#e85d04'
  },
  orderItem: {
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  confirmBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '16px'
  }
};

export default function StaffView({ onLogout }) {
  const navigate = useNavigate();
  const [hoveredTable, setHoveredTable] = useState(null);
  const [activeTab, setActiveTab] = useState('counter'); // counter, tables
  
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [staffCalls, setStaffCalls] = useState([]);
  const [waitingPaymentOrders, setWaitingPaymentOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loadingAction, setLoadingAction] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Generate 20 tables
  const tables = Array.from({ length: 20 }, (_, i) => i + 1);

  const getTableLabel = (item) => {
    const fromDirectField = item.tableName || item.table?.name;
    if (fromDirectField) return fromDirectField;
    const sourceText = item.message || item.note || '';
    const prefix = sourceText.split(' - ')[0].trim();
    if (prefix.startsWith('Bàn ')) return prefix;
    return '';
  };

  const getMethodLabel = (method) => {
    if (method === 'cash') return '💵 Tiền Mặt';
    if (method === 'transfer') return '🏦 Chuyển Khoản';
    if (method === 'card') return '💳 Quẹt Thẻ';
    return method;
  };

  useEffect(() => {
    loadPaymentRequests();
    loadStaffCalls();
    loadWaitingPaymentOrders();

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('payment-request-created', (newRequest) => {
      setPaymentRequests((prev) => [newRequest, ...prev]);
    });

    socket.on('payment-request-updated', (updatedRequest) => {
      if (updatedRequest.status !== 'pending') {
        setPaymentRequests((prev) => prev.filter((item) => item.id !== updatedRequest.id));
        return;
      }
      setPaymentRequests((prev) =>
        prev.map((item) => (item.id === updatedRequest.id ? updatedRequest : item))
      );
    });

    socket.on('staff-call-created', (newCall) => {
      setStaffCalls((prev) => [newCall, ...prev]);
    });

    socket.on('staff-call-updated', (updatedCall) => {
      if (updatedCall.status !== 'pending') {
        setStaffCalls((prev) => prev.filter((item) => item.id !== updatedCall.id));
        return;
      }
      setStaffCalls((prev) =>
        prev.map((item) => (item.id === updatedCall.id ? updatedCall : item))
      );
    });

    socket.on('new-order', (newOrder) => {
      setWaitingPaymentOrders((prev) => [newOrder, ...prev]);
    });

    const interval = setInterval(() => {
      loadPaymentRequests();
      loadStaffCalls();
      loadWaitingPaymentOrders();
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off('payment-request-created');
      socket.off('payment-request-updated');
      socket.off('staff-call-created');
      socket.off('staff-call-updated');
      socket.off('new-order');
      socket.disconnect();
    };
  }, []);

  const loadPaymentRequests = async () => {
    try {
      const response = await axios.get(PAYMENT_REQUEST_API.GET_ALL);
      setPaymentRequests(response.data || []);
    } catch (error) {
      console.error('Error loading payment requests:', error);
    }
  };

  const loadStaffCalls = async () => {
    try {
      const response = await axios.get(STAFF_CALL_API.GET_ALL);
      setStaffCalls(response.data || []);
    } catch (error) {
      console.error('Error loading staff calls:', error);
    }
  };

  const loadWaitingPaymentOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/orders/waiting-payment`);
      setWaitingPaymentOrders(response.data || []);
    } catch (error) {
      console.error('Error loading waiting payment orders:', error);
    }
  };

  const updateStaffCallStatus = async (id, status) => {
    try {
      setLoadingAction(id);
      await axios.put(STAFF_CALL_API.UPDATE_STATUS(id), { status });
      setStaffCalls((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error updating staff call:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const updatePaymentRequestStatus = async (id, status) => {
    try {
      setLoadingAction(id);
      await axios.put(PAYMENT_REQUEST_API.UPDATE_STATUS(id), { status });
      setPaymentRequests((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error updating payment request:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const processPayment = async () => {
    if (!selectedOrder) return;
    try {
      setLoadingAction('payment');
      await axios.put(`${API_BASE_URL}/orders/${selectedOrder.id}/payment`, {
        paymentStatus: 'paid',
        paymentMethod: paymentMethod,
        paidBy: currentUser?.id
      });
      setWaitingPaymentOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      setPaymentMethod('cash');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert('Lỗi thanh toán: ' + error.message);
      console.error('Error processing payment:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTableClick = (tableId) => {
    navigate(`/table/${tableId}/menu`);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Nhân Viên Phục Vụ</h1>
        <button 
          style={styles.logoutBtn}
          onClick={() => {
            if (onLogout) onLogout();
            navigate('/login');
          }}
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>

      <div style={styles.container}>
        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'counter' ? styles.tabBtnActive : {})
            }}
            onClick={() => setActiveTab('counter')}
          >
            💰 Quầy
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'tables' ? styles.tabBtnActive : {})
            }}
            onClick={() => setActiveTab('tables')}
          >
            🪑 Chọn Bàn
          </button>
        </div>

        {/* Yêu cầu gọi nhân viên */}
        {activeTab === 'counter' && staffCalls.length > 0 && (
          <div style={{ ...styles.section, borderLeft: '4px solid #ff9100' }}>
            <h2 style={{ ...styles.sectionTitle, color: '#ff9100' }}>
              <Bell size={20} /> Yêu Cầu Gọi ({staffCalls.length})
            </h2>
            <div style={styles.requestList}>
              {staffCalls.map(call => (
                <div key={call.id} style={{ ...styles.requestItem, border: '1px solid #fccaa6', background: '#fffdf8' }}>
                  <div style={styles.requestInfo}>
                    <div style={{ fontWeight: 700, color: '#0f0e2e' }}>
                      {getTableLabel(call)}
                    </div>
                    {call.message && (
                      <div style={{ fontSize: '0.9rem', color: '#555' }}>
                        Ghi chú: {call.message}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                      {new Date(call.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                  <button 
                    style={styles.actionBtn}
                    onClick={() => updateStaffCallStatus(call.id, 'completed')}
                    disabled={loadingAction === call.id}
                  >
                    Xong
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yêu cầu thanh toán */}
        {activeTab === 'counter' && paymentRequests.length > 0 && (
          <div style={{ ...styles.section, borderLeft: '4px solid #e85d04' }}>
            <h2 style={styles.sectionTitle}>
              <CreditCard size={20} /> Yêu Cầu Thanh Toán ({paymentRequests.length})
            </h2>
            <div style={styles.requestList}>
              {paymentRequests.map(req => (
                <div key={req.id} style={{ ...styles.requestItem, border: '1px solid #f3d4bd', background: '#fffaf6' }}>
                  <div style={styles.requestInfo}>
                    <div style={{ fontWeight: 700, color: '#0f0e2e' }}>
                      {getTableLabel(req)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#e85d04', fontWeight: 600 }}>
                      {getMethodLabel(req.method)}
                    </div>
                    {req.note && (
                      <div style={{ fontSize: '0.9rem', color: '#555' }}>
                        Ghi chú: {req.note}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                      {new Date(req.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                  <button 
                    style={styles.actionBtn}
                    onClick={() => updatePaymentRequestStatus(req.id, 'completed')}
                    disabled={loadingAction === req.id}
                  >
                    Xác nhận
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Danh sách đơn hàng chờ thanh toán */}
        {activeTab === 'counter' && (
          <>
            {waitingPaymentOrders.length > 0 ? (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>
                  <DollarSign size={20} /> Đơn Hàng Chờ Thanh Toán ({waitingPaymentOrders.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {waitingPaymentOrders.map(order => (
                    <div 
                      key={order.id} 
                      style={{
                        ...styles.requestItem,
                        cursor: 'pointer',
                        border: '1px solid #d4d4d4',
                        background: '#fafafa'
                      }}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div style={styles.requestInfo}>
                        <div style={{ fontWeight: 700, color: '#0f0e2e' }}>
                          {order.tableName || `Bàn ${order.tableId}`}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                          Order: {order.createdByUser?.name || 'Không rõ'}
                          {order.createdByUser?.role ? ` (${order.createdByUser.role})` : ''}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#e85d04', fontWeight: 600 }}>
                          💰 {order.total?.toLocaleString('vi-VN')} ₫
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#999' }}>
                          {order.items?.length || 0} món • {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#e85d04" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.section}>
                <p style={{ textAlign: 'center', color: '#999' }}>Không có công việc</p>
              </div>
            )}
          </>
        )}

        {/* Danh sách bàn */}
        {activeTab === 'tables' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Chọn Bàn Để Order</h2>
          <div style={styles.tableGrid}>
            {tables.map(table => (
              <button
                key={table}
                style={{
                  ...styles.tableBtn,
                  ...(hoveredTable === table ? styles.tableBtnHover : {})
                }}
                onMouseEnter={() => setHoveredTable(table)}
                onMouseLeave={() => setHoveredTable(null)}
                onClick={() => handleTableClick(table)}
              >
                <span>Bàn</span>
                <span style={{ fontSize: '1.4rem', color: '#e85d04' }}>{table}</span>
              </button>
            ))}
          </div>
        </div>
        )}
      </div>
      {selectedOrder && (
        <div style={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Thanh Toán - {selectedOrder.tableName || `Bàn ${selectedOrder.tableId}`}
              </h3>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999'
                }}
                onClick={() => setSelectedOrder(null)}
              >
                <X size={24} />
              </button>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontWeight: 600, color: '#0f0e2e' }}>Chi Tiết Đơn:</h4>
              {selectedOrder.items?.map((item, idx) => (
                <div key={idx} style={styles.orderItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f0e2e' }}>
                      {item.menuItem?.name || item.name || 'Món ăn'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#999' }}>x{item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#e85d04' }}>
                    {((item.menuItem?.price ?? item.price ?? 0) * item.quantity).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              background: '#fff3eb',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: '#0f0e2e' }}>Tổng cộng:</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e85d04' }}>
                {selectedOrder.total?.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            {/* Payment Methods */}
            <h4 style={{ margin: '0 0 12px 0', fontWeight: 600, color: '#0f0e2e' }}>Phương Thức Thanh Toán:</h4>
            <div style={styles.paymentMethodGroup}>
              <div
                style={{
                  ...styles.paymentMethod,
                  ...(paymentMethod === 'cash' ? styles.paymentMethodActive : {})
                }}
                onClick={() => setPaymentMethod('cash')}
              >
                💵<div>Tiền Mặt</div>
              </div>
              <div
                style={{
                  ...styles.paymentMethod,
                  ...(paymentMethod === 'transfer' ? styles.paymentMethodActive : {})
                }}
                onClick={() => setPaymentMethod('transfer')}
              >
                🏦<div>Chuyển Khoản</div>
              </div>
              <div
                style={{
                  ...styles.paymentMethod,
                  ...(paymentMethod === 'card' ? styles.paymentMethodActive : {})
                }}
                onClick={() => setPaymentMethod('card')}
              >
                💳<div>Quẹt Thẻ</div>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              style={styles.confirmBtn}
              onClick={processPayment}
              disabled={loadingAction === 'payment'}
            >
              {loadingAction === 'payment' ? 'Đang xử lý...' : (
                <>
                  <Check size={20} style={{ marginRight: '8px' }} />
                  Xác Nhận Thanh Toán
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {/* Success Notification Modal */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: '#10b981',
            color: '#fff',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <Check size={48} strokeWidth={3} />
          </div>
          <h2 style={{ color: '#0f0e2e', margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 800 }}>
            Thành công!
          </h2>
          <p style={{ color: '#666', margin: 0, fontWeight: 500 }}>
            Đơn hàng đã được thanh toán
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
