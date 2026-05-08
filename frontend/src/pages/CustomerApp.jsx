import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useCartStore } from '../store';
import { CUSTOMER_API, SOCKET_URL } from '../config/api';

const socket = io(SOCKET_URL);

export default function CustomerApp() {
  const { tableId } = useParams();
  const [categories, setCategories] = useState([]);
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);

  const { cart, addToCart, getCartTotal } = useCartStore();

  useEffect(() => {
    // Fetch menu
    axios.get(CUSTOMER_API.GET_TABLE_MENU(tableId))
      .then(res => {
        setCategories(res.data.categories);
        setTableName(res.data.table?.name || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
      
    // Socket handlers
    socket.on('order-placed-success', (orderId) => {
      alert(`Đã gửi đơn hàng thành công! (Mã: #${orderId})`);
      useCartStore.getState().clearCart();
    });

    socket.on('call-staff-success', () => {
      alert('Đã gửi yêu cầu gọi nhân viên!');
    });

    // Handle menu updates real-time
    socket.on('menu-item-updated', (updatedItem) => {
      setCategories(prev => {
        const newCats = [...prev];
        for (const cat of newCats) {
          const itemIdx = cat.items.findIndex(i => i.id === updatedItem.id);
          if (itemIdx >= 0) {
            cat.items[itemIdx] = updatedItem;
          }
        }
        return newCats;
      });
    });

    return () => {
      socket.off('order-placed-success');
      socket.off('call-staff-success');
      socket.off('menu-item-updated');
    }
  }, [tableId]);

  const handleCallStaff = (type) => {
    socket.emit('call-staff', {
      tableId: parseInt(tableId),
      tableName: tableName || `Bàn ${tableId}`,
      type
    });
    setShowCallModal(false);
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải menu...</div>;

  return (
    <div className="container" style={{ paddingBottom: '100px', position: 'relative' }}>
      <header style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{tableName || `Bàn ${tableId}`}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Quét mã QR gọi món</p>
        </div>
        <button 
          className="glass-panel" 
          style={{ padding: '10px 16px', borderRadius: '100px', color: 'var(--accent)', fontWeight: 'bold' }}
          onClick={() => setShowCallModal(true)}
        >
          Gọi NV
        </button>
      </header>

      {/* Menu List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {categories.map(cat => (
          <div key={cat.id} className="animate-fade-in">
            <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-muted)' }}>{cat.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
              {cat.items.map(item => (
                <div key={item.id} className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', paddingBottom: '12px', opacity: item.isAvailable ? 1 : 0.5 }}>
                  <div style={{ width: '100%', height: '140px', backgroundColor: '#2a2d36', backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {!item.isAvailable && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 'bold', border: '1px solid white', padding: '4px 12px', borderRadius: '100px' }}>Hết hàng</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{item.name}</h4>
                    <p style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px' }}>{item.price.toLocaleString()}đ</p>
                    <button 
                      className="btn-primary" 
                      style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '14px', borderRadius: 'var(--radius-md)', opacity: item.isAvailable ? 1 : 0.5, cursor: item.isAvailable ? 'pointer' : 'not-allowed' }}
                      onClick={() => item.isAvailable && addToCart(item, 1, '')}
                      disabled={!item.isAvailable}
                    >
                      {item.isAvailable ? 'Thêm' : 'Đã hết'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart */}
      {cart.length > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '16px', right: '16px', zIndex: 50, maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '16px', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(244, 63, 94, 0.4)' }}
            onClick={() => {
              if(window.confirm('Xác nhận đặt đơn hàng này?')) {
                socket.emit('place-order', {
                  tableId: parseInt(tableId),
                  items: cart.map(i => ({ menuItemId: i.menuItem.id, quantity: i.quantity, note: i.note })),
                  total: getCartTotal()
                });
              }
            }}
          >
            <span>Giỏ hàng ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            <span>{getCartTotal().toLocaleString()}đ • Đặt ngay</span>
          </button>
        </div>
      )}

      {/* Call Staff Modal */}
      {showCallModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', paddingBottom: '40px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px' }}>Gọi nhân viên phục vụ</h3>
              <button onClick={() => setShowCallModal(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', color: 'white' }} onClick={() => handleCallStaff('Thanh toán hoá đơn')}>Thanh toán</button>
              <button className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', color: 'white' }} onClick={() => handleCallStaff('Cho xin thêm đá')}>Thêm đá</button>
              <button className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', color: 'white' }} onClick={() => handleCallStaff('Lấy thêm giấy')}>Thêm giấy</button>
              <button className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', color: 'white' }} onClick={() => handleCallStaff('Dọn dẹp bàn')}>Dọn bàn</button>
              <button className="glass-panel" style={{ padding: '16px', borderRadius: '12px', textAlign: 'center', color: 'white', gridColumn: 'span 2', backgroundColor: 'rgba(255,255,255,0.1)' }} onClick={() => handleCallStaff('Hỗ trợ khác')}>Gọi nhân viên ra trực tiếp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
