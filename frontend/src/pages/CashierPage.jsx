import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { ADMIN_ORDERS_API, SOCKET_URL, API_BASE_URL, PAYMENT_REQUEST_API, STAFF_CALL_API } from '../config/api';

export default function CashierPage({ initialTab = 'waiting' }) {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [staffCalls, setStaffCalls] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const qrRef = useRef();
  
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const getTableLabel = (item) => {
    const fromDirectField = item.tableName || item.table?.name;
    if (fromDirectField) return fromDirectField;

    const sourceText = item.message || item.note || '';
    const prefix = sourceText.split(' - ')[0].trim();
    if (prefix.startsWith('Bàn ')) return prefix;

    return '';
  };

  useEffect(() => {
    loadOrders();
    loadCompletedOrders();
    loadPaymentRequests();
    loadStaffCalls();
    loadPendingOrders();

    // Connect to Socket.io
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('new-order', (newOrder) => {
      setPendingOrders((prev) => {
        if (prev.find(o => o.id === newOrder.id)) {
          return prev.map(o => o.id === newOrder.id ? newOrder : o).slice(0, 10);
        }
        return [newOrder, ...prev].slice(0, 10);
      });
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
      if (updatedOrder.status === 'completed') {
        setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
        setCompletedOrders((prev) => [updatedOrder, ...prev]);
      }
      if (['pending', 'Pending', 'Processing', 'processing', 'ready', 'Ready', 'cooking', 'Cooking'].includes(updatedOrder.status)) {
        setPendingOrders((prev) => {
          if (!prev.find(o => o.id === updatedOrder.id)) return [updatedOrder, ...prev].slice(0, 10);
          return prev.map((o) => o.id === updatedOrder.id ? updatedOrder : o);
        });
      } else {
        setPendingOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      }
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

    // Polling every 3 seconds as backup
    const interval = setInterval(() => {
      loadOrders();
      loadCompletedOrders();
      loadPaymentRequests();
      loadStaffCalls();
      loadPendingOrders();
    }, 3000);

    return () => {
      clearInterval(interval);
      socket.off('new-order');
      socket.off('order-status-update');
      socket.off('payment-request-created');
      socket.off('payment-request-updated');
      socket.off('staff-call-created');
      socket.off('staff-call-updated');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'waiting') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(completedOrders);
    }
  }, [orders, completedOrders, activeTab]);

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/orders/waiting-payment`);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
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

  const loadPendingOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/orders/pending`);
      setPendingOrders((response.data || []).slice(0, 10));
    } catch (error) {
      console.error('Error loading pending orders:', error);
    }
  };

  const getMethodLabel = (method) => {
    if (method === 'cash') return '💵 Tiền Mặt';
    if (method === 'transfer') return '🏦 Chuyển Khoản';
    if (method === 'card') return '💳 Quẹt Thẻ';
    return method;
  };

  const updatePaymentRequestStatus = async (id, status) => {
    try {
      setRequestLoading(id);
      await axios.put(PAYMENT_REQUEST_API.UPDATE_STATUS(id), { status });
      setPaymentRequests((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert('Lỗi cập nhật yêu cầu thanh toán');
      console.error('Error updating payment request:', error);
    } finally {
      setRequestLoading(null);
    }
  };

  const updateStaffCallStatus = async (id, status) => {
    try {
      setRequestLoading(id);
      await axios.put(STAFF_CALL_API.UPDATE_STATUS(id), { status });
      setStaffCalls((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert('Lỗi cập nhật yêu cầu gọi nhân viên');
      console.error('Error updating staff call:', error);
    } finally {
      setRequestLoading(null);
    }
  };

  const handlePayment = async (orderId, method) => {
    try {
      setLoading(true);
      // Update payment status
      await axios.put(ADMIN_ORDERS_API.UPDATE_PAYMENT(orderId), {
        paymentMethod: method,
        paymentStatus: 'paid',
        paidBy: currentUser?.id
      });
      // Update order status to completed
      await axios.patch(ADMIN_ORDERS_API.UPDATE_ORDER_STATUS(orderId), {
        status: 'completed'
      });
      loadCompletedOrders();
      setSelectedOrder(prev => ({ ...prev, status: 'completed', paymentMethod: method }));
    } catch (error) {
      alert('Lỗi thanh toán: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const printBill = (order) => {
    const padId = String(order.id).padStart(6, '0');
    const orderDate = new Date(order.createdAt);
    const day = String(orderDate.getDate()).padStart(2, '0');
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const year = orderDate.getFullYear();
    const billContent = `
      <html>
        <head>
          <title>Hóa đơn #${order.id}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 300px; /* Độ rộng tương tự máy in nhiệt (80mm) */
              margin: 0 auto; 
              padding: 20px 10px;
              background: #fff;
              color: #000;
              font-size: 14px;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .header-title { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .info-line { margin: 2px 0; }
            .bill-title { font-weight: bold; font-size: 18px; margin: 15px 0 5px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .solid-divider { border-top: 1px solid #000; margin: 5px 0; }
            
            table { width: 100%; border-collapse: collapse; }
            th { text-align: right; border-bottom: 1px solid #000; padding-bottom: 5px; font-weight: normal; }
            th.left { text-align: left; }
            th.center { text-align: center; }
            td { vertical-align: top; padding: 3px 0; }
            .item-name { padding-bottom: 2px; }
            .item-details { display: flex; justify-content: space-between; }
            .col-price { width: 40%; text-align: left; }
            .col-qty { width: 20%; text-align: center; }
            .col-total { width: 40%; text-align: right; }
            
            .summary { margin-top: 10px; }
            .summary-line { display: flex; justify-content: flex-end; margin: 3px 0; gap: 10px; }
            .summary-label { text-align: right; width: 60%; }
            .summary-value { text-align: right; width: 40%; }
            .total-line { font-weight: bold; font-size: 15px; margin-top: 5px; }
            
            .qr-section { text-align: center; margin-top: 20px; }
            .qr-section img { width: 120px; height: 120px; }
            .qr-label { font-weight: bold; font-size: 16px; letter-spacing: 2px; margin-bottom: 10px; }
            .footer { text-align: center; margin-top: 15px; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="header-title">CÔNG TY TNHH TMDV<br/>NHÀ HÀNG ẨM THỰC</div>
            <div class="info-line">ĐC: 479 Trần Cao Vân, Thanh Khê,<br/>Đà Nẵng</div>
            
            <div class="bill-title">HÓA ĐƠN BÁN HÀNG</div>
            <div class="info-line">Số HĐ: HD${padId}</div>
            <div class="info-line">Ngày ${day} tháng ${month} năm ${year}</div>
            <div class="info-line">SĐT: 078.860.6420</div>
          </div>

          <div style="margin-top: 15px;">
            <div class="info-line">Khách hàng: Khách lẻ - Bàn: ${order.tableName || order.table?.name || ''}</div>
            <div class="info-line">SĐT:</div>
            <div class="info-line">Địa chỉ: - -</div>
          </div>

          <div class="solid-divider"></div>
          <table>
            <thead>
              <tr>
                <th class="left col-price">Đơn giá</th>
                <th class="center col-qty">SL</th>
                <th class="col-total">Thành tiền</th>
              </tr>
            </thead>
          </table>
          <div class="solid-divider"></div>

          <div>
            ${order.items.map(item => `
              <div style="margin-bottom: 5px;">
                <div class="item-name">${item.menuItem.name} <span style="font-size:12px;color:#666">(${item.addedByUser ? item.addedByUser.name : 'Khách'})</span></div>
                <div class="item-details">
                  <div class="col-price">${item.menuItem.price.toLocaleString('vi-VN')}</div>
                  <div class="col-qty">${item.quantity}</div>
                  <div class="col-total">${(item.menuItem.price * item.quantity).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="divider"></div>

          <div class="summary">
            <div class="summary-line">
              <div class="summary-label">Tổng tiền hàng:</div>
              <div class="summary-value">${order.total.toLocaleString('vi-VN')}</div>
            </div>
            <div class="summary-line">
              <div class="summary-label">Chiết khấu:</div>
              <div class="summary-value">0</div>
            </div>
            <div class="summary-line total-line">
              <div class="summary-label">Tổng thanh toán:</div>
              <div class="summary-value">${order.total.toLocaleString('vi-VN')}</div>
            </div>
            <div class="text-center" style="margin-top: 5px; font-style: italic; color: #555;">
              (Đã bao gồm VAT)
            </div>
          </div>

          <div class="qr-section">
            <div class="qr-label">VIETQR</div>
            <!-- Dùng một API tạo QR trống hoặc hình mặc định để giống mẫu nhất -->
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ThanhToanHoaDonHD${padId}" alt="QR Code" />
          </div>

          <div class="footer">
            Cảm ơn và hẹn gặp lại!
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=700,width=500');
    printWindow.document.write(billContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const renderBillPreview = (order) => {
    const padId = String(order.id).padStart(6, '0');
    const orderDate = new Date(order.createdAt);
    const day = String(orderDate.getDate()).padStart(2, '0');
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const year = orderDate.getFullYear();

    return (
      <div style={{
        background: '#fff',
        color: '#000',
        padding: '20px 10px',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '14px',
        lineHeight: '1.4',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '350px',
        margin: '0 auto 16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>CÔNG TY TNHH TMDV<br/>NHÀ HÀNG ẨM THỰC</div>
          <div style={{ margin: '2px 0' }}>ĐC: 479 Trần Cao Vân, Thanh Khê,<br/>Đà Nẵng</div>
          
          <div style={{ fontWeight: 'bold', fontSize: '18px', margin: '15px 0 5px' }}>HÓA ĐƠN BÁN HÀNG</div>
          <div style={{ margin: '2px 0' }}>Số HĐ: HD{padId}</div>
          <div style={{ margin: '2px 0' }}>Ngày {day} tháng {month} năm {year}</div>
          <div style={{ margin: '2px 0' }}>SĐT: 078.860.6420</div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <div style={{ margin: '2px 0' }}>Khách hàng: Khách lẻ - Bàn: {order.tableName || order.table?.name || ''}</div>
          <div style={{ margin: '2px 0' }}>SĐT:</div>
          <div style={{ margin: '2px 0' }}>Địa chỉ: - -</div>
        </div>

        <div style={{ borderTop: '1px solid #000', margin: '5px 0' }}></div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #000', paddingBottom: '5px', fontWeight: 'normal', width: '40%' }}>Đơn giá</th>
              <th style={{ textAlign: 'center', borderBottom: '1px solid #000', paddingBottom: '5px', fontWeight: 'normal', width: '20%' }}>SL</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #000', paddingBottom: '5px', fontWeight: 'normal', width: '40%' }}>Thành tiền</th>
            </tr>
          </thead>
        </table>
        <div style={{ borderTop: '1px solid #000', margin: '5px 0' }}></div>

        <div>
          {order.items.map(item => (
            <div key={item.id} style={{ marginBottom: '5px' }}>
              <div style={{ paddingBottom: '2px' }}>
                {item.menuItem.name} 
                <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }}>
                  ({item.addedByUser ? item.addedByUser.name : 'Khách'})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '40%', textAlign: 'left' }}>{item.menuItem.price.toLocaleString('vi-VN')}</div>
                <div style={{ width: '20%', textAlign: 'center' }}>{item.quantity}</div>
                <div style={{ width: '40%', textAlign: 'right' }}>{(item.menuItem.price * item.quantity).toLocaleString('vi-VN')}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }}></div>

        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '3px 0', gap: '10px' }}>
            <div style={{ textAlign: 'right', width: '60%' }}>Tổng tiền hàng:</div>
            <div style={{ textAlign: 'right', width: '40%' }}>{order.total.toLocaleString('vi-VN')}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '3px 0', gap: '10px' }}>
            <div style={{ textAlign: 'right', width: '60%' }}>Chiết khấu:</div>
            <div style={{ textAlign: 'right', width: '40%' }}>0</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '3px 0', gap: '10px', fontWeight: 'bold', fontSize: '15px', marginTop: '5px' }}>
            <div style={{ textAlign: 'right', width: '60%' }}>Tổng thanh toán:</div>
            <div style={{ textAlign: 'right', width: '40%' }}>{order.total.toLocaleString('vi-VN')}</div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '5px', fontStyle: 'italic', color: '#555' }}>
            (Đã bao gồm VAT)
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px', marginBottom: '10px' }}>VIETQR</div>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ThanhToanHoaDonHD${padId}`} alt="QR Code" style={{ width: '120px', height: '120px' }} />
        </div>

        <div style={{ textAlign: 'center', marginTop: '15px', fontStyle: 'italic' }}>
          Cảm ơn và hẹn gặp lại!
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', fontFamily: '"Times New Roman", Times, serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 16px 0', color: '#e85d04', fontSize: '2rem' }}>Quầy Thu Ngân</h1>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => setActiveTab('waiting')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: activeTab === 'waiting' ? '#e85d04' : '#f5f5f5',
              color: activeTab === 'waiting' ? '#fff' : '#e85d04',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            Chờ Thanh Toán ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: activeTab === 'completed' ? '#e85d04' : '#f5f5f5',
              color: activeTab === 'completed' ? '#fff' : '#e85d04',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            Đã Thanh Toán ({completedOrders.length})
          </button>
        </div>
      </div>

      {activeTab === 'waiting' && (
        <>
          <div style={{ background: '#fff', border: '2px solid #ff910015', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h2 style={{ color: '#ff9100', margin: '0 0 16px 0', fontSize: '1.3rem' }}>
              Yêu Cầu Gọi Nhân Viên ({staffCalls.length})
            </h2>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {staffCalls.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px 12px', margin: 0 }}>Chưa có yêu cầu gọi nhân viên</p>
              ) : (
                staffCalls.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #fccaa6',
                      borderLeft: '4px solid #ff9100',
                      borderRadius: '8px',
                      padding: '12px',
                      background: '#fffdf8'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f0e2e' }}>
                          Yêu cầu #{item.id} - {getTableLabel(item)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#ff9100', fontWeight: 600 }}>📞 Gọi Nhân Viên</div>
                        {item.message && (
                          <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>Ghi chú: {item.message}</div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => updateStaffCallStatus(item.id, 'completed')}
                          disabled={requestLoading === item.id}
                          style={{
                            padding: '8px 12px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: requestLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: requestLoading === item.id ? 0.7 : 1,
                            fontWeight: 600
                          }}
                        >
                          Xong
                        </button>
                        <button
                          onClick={() => updateStaffCallStatus(item.id, 'cancelled')}
                          disabled={requestLoading === item.id}
                          style={{
                            padding: '8px 12px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: requestLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: requestLoading === item.id ? 0.7 : 1,
                            fontWeight: 600
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ background: '#fff', border: '2px solid #e85d0420', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h2 style={{ color: '#e85d04', margin: '0 0 16px 0', fontSize: '1.3rem' }}>
              Yêu Cầu Thanh Toán Từ Khách ({paymentRequests.length})
            </h2>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paymentRequests.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px 12px', margin: 0 }}>Chưa có yêu cầu thanh toán mới</p>
              ) : (
                paymentRequests.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid #f3d4bd',
                      borderLeft: '4px solid #e85d04',
                      borderRadius: '8px',
                      padding: '12px',
                      background: '#fffaf6'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f0e2e' }}>
                          Yêu cầu #{item.id} - {getTableLabel(item)}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#e85d04', fontWeight: 600 }}>{getMethodLabel(item.method)}</div>
                        {item.note && (
                          <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>Ghi chú: {item.note}</div>
                        )}
                        <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '4px' }}>
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => updatePaymentRequestStatus(item.id, 'completed')}
                          disabled={requestLoading === item.id}
                          style={{
                            padding: '8px 12px',
                            background: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: requestLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: requestLoading === item.id ? 0.7 : 1,
                            fontWeight: 600
                          }}
                        >
                          Xác Nhận
                        </button>
                        <button
                          onClick={() => updatePaymentRequestStatus(item.id, 'cancelled')}
                          disabled={requestLoading === item.id}
                          style={{
                            padding: '8px 12px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: requestLoading === item.id ? 'not-allowed' : 'pointer',
                            opacity: requestLoading === item.id ? 0.7 : 1,
                            fontWeight: 600
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Cột Danh Sách Orders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Đơn Đang Xử Lý Bếp */}
          {activeTab === 'waiting' && (
            <div style={{ background: '#fff', border: '2px solid #e85d0420', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ color: '#e85d04', margin: '0 0 16px 0', fontSize: '1.3rem' }}>
                Đơn Đang Xử Lý Bếp ({pendingOrders.length})
              </h2>
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingOrders.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Không có đơn đang chờ bếp</p>
                ) : (
                  pendingOrders.map(order => (
                    <div
                      key={`pending-${order.id}`}
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        background: selectedOrder?.id === order.id ? '#e85d0415' : '#f9f9f9',
                        border: selectedOrder?.id === order.id ? '2px solid #e85d04' : '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#0f0e2e' }}>
                            {(getTableLabel(order) || order.table?.name || (order.tableId ? `Bàn ${order.tableId}` : '')) + ` - Đơn #${order.id}`}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {order.orderType === 'dine-in' ? '🍽️ Ăn tại quán' : '🛍️ Mang về'}
                          </div>

                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#e85d04', fontSize: '1.1rem' }}>
                          {(order.total || 0).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#999' }}>
                        {order.items?.length || 0} món • {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Các Đơn Hàng (Chờ thanh toán / Đã thanh toán) */}
          <div style={{ background: '#fff', border: '2px solid #e85d0420', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ color: '#e85d04', margin: '0 0 16px 0', fontSize: '1.3rem' }}>
              {activeTab === 'waiting' ? 'Chờ Thanh Toán' : 'Đã Thanh Toán'} ({filteredOrders.length})
            </h2>
            <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredOrders.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '40px 20px' }}>Không có đơn hàng nào</p>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      background: selectedOrder?.id === order.id ? '#e85d0415' : '#f9f9f9',
                      border: selectedOrder?.id === order.id ? '2px solid #e85d04' : '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f0e2e' }}>
                          {(getTableLabel(order) || order.table?.name || (order.tableId ? `Bàn ${order.tableId}` : '')) + ` - Đơn #${order.id}`}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {order.orderType === 'dine-in' ? '🍽️ Ăn tại quán' : '🛍️ Mang về'}
                        </div>

                        {order.paidByUser ? (
                          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                            Thanh toán: {order.paidByUser.name}
                          </div>
                        ) : order.paymentStatus === 'paid' ? (
                          <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                            Thanh toán: Quầy Thu Ngân
                          </div>
                        ) : null}
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#e85d04', fontSize: '1.1rem' }}>
                        {order.total.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#999' }}>
                      {order.items.length} món • {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Chi Tiết Order */}
        <div style={{ background: '#fff', border: '2px solid #e85d0420', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          {selectedOrder ? (
            <>
              <h2 style={{ color: '#e85d04', margin: '0 0 16px 0', fontSize: '1.3rem' }}>
                Đơn #{selectedOrder.id}
              </h2>

              <div style={{ marginBottom: '16px', padding: '12px', background: '#e85d0408', borderRadius: '8px', border: '1px solid #e85d0420' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Bàn:</span>
                  <span style={{ fontWeight: 'bold' }}>{getTableLabel(selectedOrder) || selectedOrder.table?.name || (selectedOrder.tableId ? `Bàn ${selectedOrder.tableId}` : '')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Loại:</span>
                  <span style={{ fontWeight: 'bold', color: '#e85d04' }}>
                    {selectedOrder.orderType === 'dine-in' ? '🍽️ Ăn tại quán' : '🛍️ Mang về'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Giờ đặt:</span>
                  <span>{new Date(selectedOrder.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>

                {selectedOrder.paidByUser ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: '#666' }}>Thanh toán:</span>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                      {selectedOrder.paidByUser.name}
                    </span>
                  </div>
                ) : selectedOrder.paymentStatus === 'paid' ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: '#666' }}>Thanh toán:</span>
                    <span style={{ fontWeight: 'bold', color: '#10b981' }}>
                      Quầy Thu Ngân
                    </span>
                  </div>
                ) : null}
              </div>

              <h3 style={{ color: '#0f0e2e', fontSize: '1rem', margin: '12px 0 8px 0' }}>Các Món Ăn:</h3>
              <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '16px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
                {selectedOrder.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.95rem' }}>
                    <div style={{ flex: 1 }}>
                      <div>{item.menuItem.name} x{item.quantity}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Order: {item.addedByUser ? item.addedByUser.name : 'Khách'}</div>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{(item.menuItem.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>

              <div style={{ background: '#e85d0408', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '2px solid #e85d04' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: '#e85d04' }}>
                  <span>TỔNG:</span>
                  <span>{selectedOrder.total.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* PAYMENT SECTION */}
              {selectedOrder.status === 'pending' || selectedOrder.status === 'cooking' || selectedOrder.status === 'ready' ? (
                <div style={{ padding: '16px', background: '#f59e0b15', border: '2px solid #f59e0b', borderRadius: '8px', textAlign: 'center', color: '#d97706', fontWeight: 'bold' }}>
                  ⏳ Đơn đang được Bếp xử lý
                </div>
              ) : selectedOrder.status === 'completed' || activeTab === 'completed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '100%', padding: '16px', background: '#10b98115', border: '2px solid #10b981', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✅ Thanh toán thành công!</div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Phương thức: <strong>{getMethodLabel(selectedOrder.paymentMethod)}</strong>
                    </div>
                  </div>
                  
                  {renderBillPreview(selectedOrder)}
                  
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button onClick={() => printBill(selectedOrder)} style={{ flex: 1, padding: '12px', background: '#e85d04', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: '"Times New Roman", Times, serif' }}>📄 In Bill</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Phương thức thanh toán:</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: paymentMethod === 'card' ? '2px solid #e85d04' : '1px solid #ddd', background: paymentMethod === 'card' ? '#e85d0415' : '#fff', color: paymentMethod === 'card' ? '#e85d04' : '#666', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif' }}
                    >Thẻ</button>
                    <button
                      onClick={() => setPaymentMethod('qr_code')}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: paymentMethod === 'qr_code' ? '2px solid #e85d04' : '1px solid #ddd', background: paymentMethod === 'qr_code' ? '#e85d0415' : '#fff', color: paymentMethod === 'qr_code' ? '#e85d04' : '#666', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif' }}
                    >QR Code</button>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: paymentMethod === 'cash' ? '2px solid #e85d04' : '1px solid #ddd', background: paymentMethod === 'cash' ? '#e85d0415' : '#fff', color: paymentMethod === 'cash' ? '#e85d04' : '#666', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif' }}
                    >Tiền Mặt</button>
                  </div>
                  <button
                    onClick={() => handlePayment(selectedOrder.id, paymentMethod)}
                    disabled={loading || !paymentMethod}
                    style={{
                      padding: '14px',
                      background: (loading || !paymentMethod) ? '#999' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (loading || !paymentMethod) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      marginTop: '8px',
                      fontFamily: '"Times New Roman", Times, serif'
                    }}
                  >
                    Thanh Toán
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
              <p>Chọn một đơn hàng để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>

      {/* QR Payment Modal */}
      {showQRModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff 0%, #f9f5f0 100%)',
            borderRadius: '24px',
            padding: '48px 40px',
            maxWidth: '500px',
            textAlign: 'center',
            border: '3px solid #e85d04',
            boxShadow: '0 20px 60px rgba(232, 93, 4, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative background elements */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: 'rgba(232, 93, 4, 0.08)',
              borderRadius: '50%',
              zIndex: 0
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '100px',
              height: '100px',
              background: 'rgba(245, 168, 104, 0.08)',
              borderRadius: '50%',
              zIndex: 0
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💳</div>
              <h2 style={{
                color: '#e85d04',
                margin: '0 0 8px 0',
                fontSize: '2rem',
                fontWeight: 900,
                fontFamily: '"Times New Roman", Times, serif'
              }}>
                Mã QR Thanh Toán
              </h2>
              <div style={{ height: '3px', width: '60px', background: 'linear-gradient(90deg, #e85d04, #f5a868)', margin: '12px auto 24px', borderRadius: '999px' }} />

              <div style={{
                background: 'rgba(232, 93, 4, 0.08)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid rgba(232, 93, 4, 0.2)'
              }}>
                <p style={{ color: '#666', margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 500 }}>
                  🍽️ <strong>{getTableLabel(selectedOrder) || selectedOrder.table?.name || (selectedOrder.tableId ? `Bàn ${selectedOrder.tableId}` : '')}</strong>
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #e85d04, #f5a868)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {selectedOrder.total.toLocaleString('vi-VN')}₫
                </p>
              </div>

              <div style={{
                background: '#fff',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'center',
                border: '3px solid #e85d04',
                boxShadow: '0 8px 24px rgba(232, 93, 4, 0.15)'
              }}>
                <QRCode
                  value={`https://qr.example.com/pay/${selectedOrder.id}/${selectedOrder.total}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p style={{
                fontSize: '0.95rem',
                color: '#999',
                marginBottom: '28px',
                fontFamily: '"Times New Roman", Times, serif',
                fontStyle: 'italic'
              }}>
                👆 Khách hàng quét mã QR để thanh toán
              </p>

              <div style={{ display: 'flex', gap: '14px' }}>
                <button
                  onClick={() => setShowQRModal(false)}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: '#f0f0f0',
                    color: '#666',
                    border: '2px solid #e5e5e5',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem',
                    fontFamily: '"Times New Roman", Times, serif',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e5e5e5';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f0f0f0';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handlePayment(selectedOrder.id, 'qr_code');
                    setShowQRModal(false);
                  }}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: '700',
                    fontSize: '1rem',
                    fontFamily: '"Times New Roman", Times, serif',
                    transition: 'all 0.3s',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => !loading && (
                    e.target.style.transform = 'translateY(-2px)',
                    e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.5)'
                  )}
                  onMouseLeave={(e) => (
                    e.target.style.transform = 'translateY(0)',
                    e.target.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.3)'
                  )}
                >
                  {loading ? '⏳ Xử lý...' : '✅ Thanh toán rồi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
