import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { ADMIN_MENU_API, SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL);

export default function DashboardApp() {
  const [orders, setOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | menu
  const navigate = useNavigate();

  useEffect(() => {
    // Check login
    const user = sessionStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    // Tải menu để quản lý hiển thị
    axios.get(ADMIN_MENU_API.GET_ALL_MENU).then(res => setMenuItems(res.data));

    // Lấy các order đang chờ (optional: nếu backend có API lấy order hiện tại)
    // Tạm thời chỉ listen real-time

    socket.on('new-order', (order) => {
      setOrders(prev => [order, ...prev]);
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(e => console.log(e));
    });

    socket.on('order-status-changed', (updatedOrder) => {
      if(updatedOrder.status === 'completed') {
         setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
         const audio = new Audio('https://actions.google.com/sounds/v1/water/glass_clink.ogg');
         audio.play().catch(e => console.log(e));
      } else {
         setOrders(prev => {
           const exists = prev.find(o => o.id === updatedOrder.id);
           if (exists) {
             return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
           }
           return [updatedOrder, ...prev];
         });
         if (updatedOrder.status === 'ready') {
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
            audio.play().catch(e => console.log(e));
         }
      }
    });
    
    socket.on('menu-item-updated', (updatedItem) => {
       setMenuItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    });

    socket.on('staff-called', (callArgs) => {
      setCalls(prev => [callArgs, ...prev]);
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');
      audio.play().catch(e => console.log(e));
    });

    return () => {
      socket.off('new-order');
      socket.off('order-status-changed');
      socket.off('menu-item-updated');
      socket.off('staff-called');
    };
  }, [navigate]);

  const markReady = (orderId) => {
    socket.emit('update-order-status', { orderId, status: 'ready' });
  };

  const markDelivered = (orderId) => {
    socket.emit('update-order-status', { orderId, status: 'completed' });
  };

  const markResolved = (id) => {
    setCalls(prev => prev.filter(c => c.id !== id));
  };

  const toggleAvailability = (item) => {
    socket.emit('toggle-item-availability', { itemId: item.id, isAvailable: !item.isAvailable });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'cooking');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1>Bảng điều khiển (Bếp & Phục vụ)</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface-glass)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button 
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: activeTab === 'dashboard' ? 'var(--accent)' : 'transparent', color: 'white' }}
              onClick={() => setActiveTab('dashboard')}
            >
              Hoạt động
            </button>
            <button 
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: activeTab === 'menu' ? 'var(--accent)' : 'transparent', color: 'white' }}
              onClick={() => setActiveTab('menu')}
            >
              Quản lý Món
            </button>
          </div>
          <button className="btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px' }}>Đăng xuất</button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr) minmax(300px, 1fr)', gap: '24px' }}>
          
          {/* Cột 1: Yêu cầu Phục vụ */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', alignSelf: 'start' }}>
            <h2 style={{ color: 'var(--warning)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              Yêu cầu <span>({calls.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {calls.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Chưa có yêu cầu nào.</p>}
              {calls.map(call => (
                <div key={call.id} style={{ background: 'rgba(255, 167, 38, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{call.table?.name || `Bàn ${call.tableId || call.table?.id || ''}`}</h4>
                      <div style={{ color: 'var(--warning)', marginTop: '4px', fontWeight: 'bold' }}>{call.type}</div>
                    </div>
                    <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }} onClick={() => markResolved(call.id)}>Xong</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột 2: Bếp - Chờ chế biến */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', alignSelf: 'start' }}>
            <h2 style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              Bếp chờ nấu <span>({pendingOrders.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {pendingOrders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Không có đơn chờ.</p>}
              {pendingOrders.map(order => (
                <div key={order.id} style={{ background: 'rgba(255, 75, 75, 0.1)', padding: '16px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0 }}>{order.table?.name || `Bàn ${order.tableId}`}</h3>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>#{order.id}</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
                    {order.items.map(item => (
                      <li key={item.id} style={{ marginBottom: '8px' }}>
                        <strong style={{ color: 'var(--accent)', marginRight: '8px' }}>{item.quantity}x</strong> 
                        {item.menuItem.name}
                        {item.note && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>* {item.note}</div>}
                      </li>
                    ))}
                  </ul>
                  <button className="btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent)' }} onClick={() => markReady(order.id)}>Báo món xong</button>
                </div>
              ))}
            </div>
          </div>

          {/* Cột 3: Phục vụ - Chờ giao */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', alignSelf: 'start' }}>
            <h2 style={{ color: 'var(--success)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              Chờ mang ra bàn <span>({readyOrders.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {readyOrders.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Không có món chờ giao.</p>}
              {readyOrders.map(order => (
                <div key={order.id} style={{ background: 'rgba(0, 230, 118, 0.1)', padding: '16px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--success)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0 }}>{order.table?.name || `Bàn ${order.tableId}`}</h3>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>#{order.id}</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0', opacity: 0.8 }}>
                    {order.items.map(item => (
                      <li key={item.id} style={{ marginBottom: '4px', fontSize: '14px' }}>
                        {item.quantity}x {item.menuItem.name}
                      </li>
                    ))}
                  </ul>
                  <button className="btn-primary" style={{ width: '100%', backgroundColor: 'var(--success)' }} onClick={() => markDelivered(order.id)}>Xác nhận đã giao</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {activeTab === 'menu' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Bật/tắt trạng thái hiển thị của các món trên Menu.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {menuItems.map(item => (
              <div key={item.id} style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.isAvailable ? 1 : 0.5, border: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ marginBottom: '4px', margin: 0 }}>{item.name}</h4>
                  <span style={{ color: item.isAvailable ? 'var(--success)' : 'var(--accent)', fontSize: '12px', fontWeight: 'bold' }}>
                    {item.isAvailable ? 'Đang bán' : 'Hết hàng'}
                  </span>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: item.isAvailable ? 'var(--accent)' : 'var(--success)', padding: '8px 12px', fontSize: '12px' }}
                  onClick={() => toggleAvailability(item)}
                >
                  {item.isAvailable ? 'Báo hết hơi' : 'Bật lại'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
