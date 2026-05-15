import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LogOut, Bell, CreditCard, ChevronRight, X, DollarSign, Check, Trash2, PlusCircle, Scissors, ArrowRightLeft } from 'lucide-react';
import { PAYMENT_REQUEST_API, STAFF_CALL_API, SOCKET_URL, API_BASE_URL, ADMIN_ORDERS_API, ADMIN_ORDER_EDIT_API } from '../config/api';

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
  },
  editActionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px'
  },
  editActionBtn: {
    border: 'none',
    borderRadius: '10px',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  editPrimaryBtn: {
    background: '#e85d04',
    color: '#fff'
  },
  editSecondaryBtn: {
    background: '#fff3eb',
    color: '#e85d04',
    border: '1px solid #f4c6aa'
  },
  editDangerBtn: {
    background: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca'
  },
  orderSectionTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    margin: '0 0 12px 0'
  },
  compactCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '14px',
    background: '#fff'
  },
  compactCardButton: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid #ddd',
    borderRadius: '12px',
    background: '#fafafa',
    padding: '14px',
    cursor: 'pointer'
  },
  checkboxList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: '12px 0 18px 0'
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #eee',
    borderRadius: '10px',
    padding: '12px'
  },
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    marginTop: '8px'
  }
};

export default function StaffView({ onLogout }) {
  const navigate = useNavigate();
  const [hoveredTable, setHoveredTable] = useState(null);
  const [activeTab, setActiveTab] = useState('counter'); // counter, tables
  const [tables, setTables] = useState([]);

  const [paymentRequests, setPaymentRequests] = useState([]);
  const [staffCalls, setStaffCalls] = useState([]);
  const [waitingPaymentOrders, setWaitingPaymentOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loadingAction, setLoadingAction] = useState(null);
  const [mutationLoading, setMutationLoading] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitDestinationTableId, setSplitDestinationTableId] = useState('');
  const [splitItemIds, setSplitItemIds] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSourceOrderId, setMergeSourceOrderId] = useState('');

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Generate 20 tables (removed, fetched from API)

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
    loadTables();
    loadOpenOrders();
    loadPaymentRequests();
    loadStaffCalls();
    loadWaitingPaymentOrders();
    loadCompletedOrders();

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
      setOpenOrders((prev) => {
        if (prev.find((o) => o.id === newOrder.id)) {
          return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
        }
        return [newOrder, ...prev];
      });
      setWaitingPaymentOrders((prev) => {
        if (prev.find(o => o.id === newOrder.id)) {
          return prev.map(o => o.id === newOrder.id ? newOrder : o);
        }
        return [newOrder, ...prev];
      });
    });

    socket.on('order-status-update', () => {
      loadOpenOrders();
      loadWaitingPaymentOrders();
      loadCompletedOrders();
    });

    socket.on('order-updated', () => {
      loadOpenOrders();
      loadWaitingPaymentOrders();
      loadCompletedOrders();
    });

    socket.on('order-paid', (paidOrder) => {
      setOpenOrders((prev) => prev.filter((o) => o.id !== paidOrder.id));
      setWaitingPaymentOrders((prev) => prev.filter((o) => o.id !== paidOrder.id));
      setCompletedOrders((prev) => {
        if (prev.find(o => o.id === paidOrder.id)) return prev;
        return [paidOrder, ...prev];
      });
    });

    const interval = setInterval(() => {
      loadPaymentRequests();
      loadStaffCalls();
      loadWaitingPaymentOrders();
      loadCompletedOrders();
    }, 5000);

    return () => {
      clearInterval(interval);
      socket.off('payment-request-created');
      socket.off('payment-request-updated');
      socket.off('staff-call-created');
      socket.off('staff-call-updated');
      socket.off('new-order');
      socket.off('order-status-update');
      socket.off('order-updated');
      socket.off('order-paid');
      socket.disconnect();
    };
  }, []);

  const loadTables = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/tables`);
      setTables(response.data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

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

  const loadOpenOrders = async () => {
    try {
      const response = await axios.get(ADMIN_ORDERS_API.GET_PENDING_ORDERS);
      setOpenOrders(response.data || []);
    } catch (error) {
      console.error('Error loading open orders:', error);
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

  const loadCompletedOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/orders/completed`);
      setCompletedOrders(response.data || []);
    } catch (error) {
      console.error('Error loading completed orders:', error);
    }
  };

  const refreshOrders = async () => {
    await Promise.all([
      loadTables(),
      loadOpenOrders(),
      loadPaymentRequests(),
      loadStaffCalls(),
      loadWaitingPaymentOrders(),
      loadCompletedOrders()
    ]);
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

  const handleTableClick = (table) => {
    const relatedOrder = [...openOrders, ...waitingPaymentOrders].find((order) => order.tableId === table.id);
    if (table.status === 'occupied' && relatedOrder) {
      setSelectedOrder(relatedOrder);
      return;
    }

    navigate(`/table/${table.id}/menu`);
  };

  const canEditSelectedOrder = selectedOrder && selectedOrder.paymentStatus === 'unpaid' && selectedOrder.status !== 'completed';

  const handleAddItemsToTable = () => {
    if (!selectedOrder) return;
    navigate(`/table/${selectedOrder.tableId}/menu`);
  };

  const handleDeleteOrderItem = async (itemId) => {
    if (!selectedOrder || !canEditSelectedOrder) return;

    if (!window.confirm('Xoá món này khỏi đơn?')) return;

    try {
      setMutationLoading(`delete-${itemId}`);
      const response = await axios.delete(ADMIN_ORDER_EDIT_API.DELETE_ORDER_ITEM(selectedOrder.id, itemId));

      if (response.data?.deleted) {
        setSelectedOrder(null);
      } else if (response.data?.order) {
        setSelectedOrder(response.data.order);
      }

      await refreshOrders();
    } catch (error) {
      console.error('Error deleting order item:', error);
      alert(error.response?.data?.error || 'Không thể xoá món');
    } finally {
      setMutationLoading(null);
    }
  };

  const openSplitModal = () => {
    if (!selectedOrder || !canEditSelectedOrder) return;
    setSplitItemIds(selectedOrder.items?.map((item) => item.id) || []);
    const nextTable = tables.find((table) => table.id !== selectedOrder.tableId);
    setSplitDestinationTableId(nextTable ? String(nextTable.id) : '');
    setShowSplitModal(true);
  };

  const toggleSplitItem = (itemId) => {
    setSplitItemIds((prev) => (
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    ));
  };

  const handleSplitOrder = async () => {
    if (!selectedOrder || !canEditSelectedOrder) return;
    if (!splitDestinationTableId || splitItemIds.length === 0) {
      alert('Chọn ít nhất một món và một bàn đích');
      return;
    }

    try {
      setMutationLoading('split');
      const response = await axios.post(ADMIN_ORDER_EDIT_API.SPLIT_ORDER(selectedOrder.id), {
        tableId: Number(splitDestinationTableId),
        itemIds: splitItemIds
      });

      if (response.data?.sourceOrder) {
        setSelectedOrder(response.data.sourceOrder);
      } else {
        setSelectedOrder(null);
      }

      setShowSplitModal(false);
      await refreshOrders();
    } catch (error) {
      console.error('Error splitting order:', error);
      alert(error.response?.data?.error || 'Không thể tách bàn');
    } finally {
      setMutationLoading(null);
    }
  };

  const openMergeModal = () => {
    if (!selectedOrder || !canEditSelectedOrder) return;
    const candidate = [...openOrders, ...waitingPaymentOrders].find((order) => order.id !== selectedOrder.id);
    setMergeSourceOrderId(candidate ? String(candidate.id) : '');
    setShowMergeModal(true);
  };

  const handleMergeOrders = async () => {
    if (!selectedOrder || !canEditSelectedOrder) return;
    if (!mergeSourceOrderId) {
      alert('Chọn một bàn/đơn khác để gộp');
      return;
    }

    try {
      setMutationLoading('merge');
      const response = await axios.post(ADMIN_ORDER_EDIT_API.MERGE_ORDERS(selectedOrder.id), {
        sourceOrderId: Number(mergeSourceOrderId)
      });

      if (response.data?.targetOrder) {
        setSelectedOrder(response.data.targetOrder);
      }

      setShowMergeModal(false);
      await refreshOrders();
    } catch (error) {
      console.error('Error merging orders:', error);
      alert(error.response?.data?.error || 'Không thể gộp bàn');
    } finally {
      setMutationLoading(null);
    }
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
            Quầy
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'tables' ? styles.tabBtnActive : {})
            }}
            onClick={() => setActiveTab('tables')}
          >
            Chọn Bàn
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'paid' ? styles.tabBtnActive : {})
            }}
            onClick={() => setActiveTab('paid')}
          >
            Đã thanh toán
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

        {activeTab === 'counter' && openOrders.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <ArrowRightLeft size={20} /> Đơn Đang Mở ({openOrders.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {openOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  style={styles.compactCardButton}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div style={{ fontWeight: 800, color: '#0f0e2e', marginBottom: '6px' }}>
                    {order.tableName || `Bàn ${order.tableId}`} - Đơn #{order.id}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    {order.items?.length || 0} món • {order.createdByUser?.name || 'Không rõ'}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#e85d04', fontWeight: 700, marginTop: '6px' }}>
                    💰 {order.total?.toLocaleString('vi-VN')} ₫
                  </div>
                </button>
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
                  key={table.id}
                  style={{
                    ...styles.tableBtn,
                    ...(hoveredTable === table.id ? styles.tableBtnHover : {}),
                    background: table.status === 'occupied' ? '#fff3eb' : styles.tableBtn.background,
                    borderColor: table.status === 'occupied' ? '#e85d04' : styles.tableBtn.borderColor
                  }}
                  onMouseEnter={() => setHoveredTable(table.id)}
                  onMouseLeave={() => setHoveredTable(null)}
                  onClick={() => handleTableClick(table)}
                >
                  <span>{table.name || `Bàn ${table.id}`}</span>
                  {table.status === 'occupied' && (
                    <span style={{ fontSize: '0.8rem', color: '#e85d04', marginTop: '4px', fontWeight: 'bold' }}>
                      Có khách
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Danh sách đơn hàng đã thanh toán */}
      {activeTab === 'paid' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Check size={20} /> Đơn Đã Thanh Toán ({completedOrders.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Không có đơn nào</div>
            ) : (
              completedOrders.map(order => (
                <div
                  key={`comp-${order.id}`}
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
                      {order.tableName || `Bàn ${order.tableId}`} - Đơn #{order.id}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                      Order: {order.createdByUser?.name || 'Không rõ'}
                    </div>
                    {order.paidByUser ? (
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                        Thanh toán: {order.paidByUser.name}
                      </div>
                    ) : order.paymentStatus === 'paid' ? (
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                        Thanh toán: Quầy Thu Ngân
                      </div>
                    ) : null}
                    <div style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 600 }}>
                      💰 {order.total?.toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                      {order.items?.length || 0} món • {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                  <ChevronRight size={20} color="#10b981" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div style={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {selectedOrder.status === 'completed' || selectedOrder.paymentStatus === 'paid' ? 'Chi Tiết Đơn' : 'Thanh Toán'} - {selectedOrder.tableName || `Bàn ${selectedOrder.tableId}`}
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
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                      Order: {item.addedByUser ? item.addedByUser.name : 'Khách'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#999' }}>x{item.quantity}</div>
                  </div>
                  {canEditSelectedOrder && (
                    <button
                      type="button"
                      onClick={() => handleDeleteOrderItem(item.id)}
                      disabled={mutationLoading === `delete-${item.id}`}
                      style={{
                        border: 'none',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        borderRadius: '8px',
                        padding: '8px',
                        marginRight: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div style={{ fontWeight: 600, color: '#e85d04' }}>
                    {((item.menuItem?.price ?? item.price ?? 0) * item.quantity).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
            </div>

            {canEditSelectedOrder && (
              <div style={styles.editActionRow}>
                <button
                  type="button"
                  style={{ ...styles.editActionBtn, ...styles.editPrimaryBtn }}
                  onClick={handleAddItemsToTable}
                >
                  <PlusCircle size={16} /> Thêm món
                </button>
                <button
                  type="button"
                  style={{ ...styles.editActionBtn, ...styles.editSecondaryBtn }}
                  onClick={openSplitModal}
                >
                  <Scissors size={16} /> Tách bàn
                </button>
                <button
                  type="button"
                  style={{ ...styles.editActionBtn, ...styles.editSecondaryBtn }}
                  onClick={openMergeModal}
                >
                  <ArrowRightLeft size={16} /> Gộp bàn
                </button>
              </div>
            )}

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

            {selectedOrder.status === 'completed' || selectedOrder.paymentStatus === 'paid' ? (
              <div style={{ background: '#e0f2fe', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <Check size={32} color="#0284c7" style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 8px 0', color: '#0284c7', fontSize: '1.1rem' }}>Đã Thanh Toán</h4>
                <div style={{ fontSize: '0.9rem', color: '#0369a1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Phương thức: <strong>{getMethodLabel(selectedOrder.paymentMethod)}</strong></span>
                  {selectedOrder.paidByUser ? (
                    <span>Người thu: <strong>{selectedOrder.paidByUser.name}</strong></span>
                  ) : (
                    <span>Người thu: <strong>Quầy Thu Ngân</strong></span>
                  )}
                  <span>Thời gian: {new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
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

      {showSplitModal && selectedOrder && (
        <div style={styles.modal} onClick={() => setShowSplitModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Tách bàn - {selectedOrder.tableName || `Bàn ${selectedOrder.tableId}`}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }} onClick={() => setShowSplitModal(false)}>
                <X size={24} />
              </button>
            </div>

            <p style={{ marginTop: 0, color: '#555' }}>Chọn món cần chuyển sang bàn khác. Bàn đích có sẵn đơn mở thì hệ thống sẽ gộp vào đơn đó.</p>

            <div style={styles.checkboxList}>
              {selectedOrder.items?.map((item) => (
                <label key={item.id} style={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={splitItemIds.includes(item.id)}
                    onChange={() => toggleSplitItem(item.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f0e2e' }}>{item.menuItem?.name || item.name || 'Món ăn'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>x{item.quantity} • {((item.menuItem?.price ?? item.price ?? 0) * item.quantity).toLocaleString('vi-VN')} ₫</div>
                  </div>
                </label>
              ))}
            </div>

            <label style={{ fontWeight: 700, color: '#0f0e2e' }}>
              Bàn đích
              <select
                value={splitDestinationTableId}
                onChange={(e) => setSplitDestinationTableId(e.target.value)}
                style={styles.select}
              >
                <option value="">-- Chọn bàn --</option>
                {tables
                  .filter((table) => table.id !== selectedOrder.tableId)
                  .map((table) => (
                    <option key={table.id} value={table.id}>{table.name || `Bàn ${table.id}`}{table.status === 'occupied' ? ' (đang có khách)' : ''}</option>
                  ))}
              </select>
            </label>

            <button
              style={styles.confirmBtn}
              onClick={handleSplitOrder}
              disabled={mutationLoading === 'split'}
            >
              {mutationLoading === 'split' ? 'Đang tách...' : 'Xác nhận tách bàn'}
            </button>
          </div>
        </div>
      )}

      {showMergeModal && selectedOrder && (
        <div style={styles.modal} onClick={() => setShowMergeModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Gộp bàn vào {selectedOrder.tableName || `Bàn ${selectedOrder.tableId}`}</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }} onClick={() => setShowMergeModal(false)}>
                <X size={24} />
              </button>
            </div>

            <p style={{ marginTop: 0, color: '#555' }}>Chọn một đơn mở khác để gộp toàn bộ món vào đơn hiện tại.</p>

            <label style={{ fontWeight: 700, color: '#0f0e2e' }}>
              Đơn nguồn
              <select
                value={mergeSourceOrderId}
                onChange={(e) => setMergeSourceOrderId(e.target.value)}
                style={styles.select}
              >
                <option value="">-- Chọn đơn cần gộp --</option>
                {[...openOrders, ...waitingPaymentOrders]
                  .filter((order) => order.id !== selectedOrder.id)
                  .map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.tableName || `Bàn ${order.tableId}`} - Đơn #{order.id}
                    </option>
                  ))}
              </select>
            </label>

            <button
              style={styles.confirmBtn}
              onClick={handleMergeOrders}
              disabled={mutationLoading === 'merge'}
            >
              {mutationLoading === 'merge' ? 'Đang gộp...' : 'Xác nhận gộp bàn'}
            </button>
          </div>
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
