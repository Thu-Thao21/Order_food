import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { SOCKET_URL } from '../config/api';
import { MergeTableModal, SplitTableModal, UnmergeTableModal } from '../components/TableActionModals';

const socket = io(SOCKET_URL);

export default function DashboardApp() {
  const [orders, setOrders] = useState([]);
  const [calls, setCalls] = useState([]);
  const [showMerge, setShowMerge] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [showUnmerge, setShowUnmerge] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check login
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

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
    
    // Listen for regular order status update as well
    socket.on('order-status-update', (updatedOrder) => {
      if(updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
         setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
      } else {
         setOrders(prev => {
           const exists = prev.find(o => o.id === updatedOrder.id);
           if (exists) {
             return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
           }
           return [updatedOrder, ...prev];
         });
      }
    });

    socket.on('staff-called', (callArgs) => {
      setCalls(prev => [callArgs, ...prev]);
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');
      audio.play().catch(e => console.log(e));
    });

    return () => {
      socket.off('new-order');
      socket.off('order-status-changed');
      socket.off('order-status-update');
      socket.off('staff-called');
    };
  }, [navigate]);

  const markDelivered = (orderId) => {
    socket.emit('update-order-status', { orderId, status: 'completed' });
  };

  const markResolved = (id) => {
    setCalls(prev => prev.filter(c => c.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Times New Roman", Times, serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ color: '#e85d04', margin: 0 }}>Bảng điều khiển Phục vụ</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => {
              const tableId = prompt('Nhập số bàn để đặt món thay khách:');
              if (tableId) navigate(`/table/${tableId}/menu?role=staff`);
            }}
          >
            Lên Đơn
          </button>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', background: '#ffcc00', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => setShowMerge(true)}
          >
            Nhóm Bàn
          </button>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => setShowUnmerge(true)}
          >
            Hủy Nhóm Bàn
          </button>
          <button 
            style={{ padding: '10px 16px', borderRadius: '8px', background: '#4caf50', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => setShowSplit(true)}
          >
            Tách Món
          </button>
          <button className="btn-secondary" onClick={handleLogout} style={{ padding: '8px 16px', marginLeft: '16px' }}>Đăng xuất</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '24px' }}>
        
        {/* Cột 1: Yêu cầu Phục vụ */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '2px solid #e85d0420' }}>
          <h2 style={{ color: '#ff9100', borderBottom: '1px solid #e5e5e5', paddingBottom: '12px', margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
            Yêu cầu từ khách <span>({calls.length})</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {calls.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>Chưa có yêu cầu nào.</p>}
            {calls.map(call => (
              <div key={call.id} style={{ background: '#fffdf8', padding: '16px', borderRadius: '8px', border: '1px solid #fccaa6', borderLeft: '4px solid #ff9100' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: '#0f0e2e' }}>{call.table?.name || `Bàn ${call.tableId || call.table?.id || ''}`}</h3>
                    <div style={{ color: '#ff9100', fontWeight: 'bold' }}>{call.type}</div>
                  </div>
                  <button style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => markResolved(call.id)}>Xong</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cột 2: Phục vụ - Chờ giao */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: '#fff', border: '2px solid #e85d0420' }}>
          <h2 style={{ color: '#10b981', borderBottom: '1px solid #e5e5e5', paddingBottom: '12px', margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
            Món Bếp đã nấu xong (Chờ giao) <span>({readyOrders.length})</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {readyOrders.length === 0 && <p style={{ color: '#999', textAlign: 'center' }}>Không có món chờ giao.</p>}
            {readyOrders.map(order => (
              <div key={order.id} style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: '#0f0e2e' }}>{order.table?.name || `Bàn ${order.tableId}`}</h3>
                  <span style={{ fontSize: '14px', color: '#999' }}>Đơn #{order.id}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
                  {order.items.map(item => (
                    <li key={item.id} style={{ marginBottom: '8px', fontSize: '15px', color: '#333' }}>
                      <strong style={{ color: '#10b981' }}>{item.quantity}x</strong> {item.menuItem.name}
                    </li>
                  ))}
                </ul>
                <button style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }} onClick={() => markDelivered(order.id)}>Xác nhận đã mang ra bàn</button>
              </div>
            ))}
          </div>
        </div>

      </div>

      <MergeTableModal isOpen={showMerge} onClose={() => setShowMerge(false)} />
      <UnmergeTableModal isOpen={showUnmerge} onClose={() => setShowUnmerge(false)} />
      <SplitTableModal isOpen={showSplit} onClose={() => setShowSplit(false)} />
    </div>
  );
}
