import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LogOut, Bell, CreditCard, ChevronRight } from 'lucide-react';
import { PAYMENT_REQUEST_API, STAFF_CALL_API, SOCKET_URL } from '../config/api';

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
  }
};

export default function StaffView({ onLogout }) {
  const navigate = useNavigate();
  const [hoveredTable, setHoveredTable] = useState(null);
  
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [staffCalls, setStaffCalls] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);

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

    const interval = setInterval(() => {
      loadPaymentRequests();
      loadStaffCalls();
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off('payment-request-created');
      socket.off('payment-request-updated');
      socket.off('staff-call-created');
      socket.off('staff-call-updated');
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
        {/* Yêu cầu gọi nhân viên */}
        {staffCalls.length > 0 && (
          <div style={{ ...styles.section, borderLeft: '4px solid #ff9100' }}>
            <h2 style={{ ...styles.sectionTitle, color: '#ff9100' }}>
              <Bell size={20} /> Yêu Cầu Gọi Nhân Viên ({staffCalls.length})
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
        {paymentRequests.length > 0 && (
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

        {/* Danh sách bàn */}
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
      </div>
    </div>
  );
}
