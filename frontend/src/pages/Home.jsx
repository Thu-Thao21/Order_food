import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Zap, Clock, Star, Phone, User, X } from 'lucide-react';
import { PAYMENT_REQUEST_API, RATING_API, STAFF_CALL_API, CUSTOMER_API } from '../config/api';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    paddingTop: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
    lineHeight: 1.5
  },
  header: {
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    color: '#fff',
    padding: '16px 20px',
    boxShadow: '0 4px 12px rgba(232, 93, 4, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    letterSpacing: '-0.02em'
  },
  headerLinks: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  headerLink: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.3s',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.01em'
  },
  hero: {
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    color: '#fff',
    padding: '48px 20px',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: 800,
    marginBottom: '12px',
    lineHeight: 1.3,
    color: '#fff',
    letterSpacing: '-0.02em'
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    marginBottom: '32px',
    opacity: 0.95,
    fontWeight: 500,
    color: '#fff',
    lineHeight: 1.6,
    letterSpacing: '0.01em'
  },
  heroButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 32px',
    background: '#fff',
    color: '#e85d04',
    textDecoration: 'none',
    borderRadius: '999px',
    fontSize: '1.1rem',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    letterSpacing: '0.02em',
    width: '100%',
    maxWidth: '350px'
  },
  secondaryBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 32px',
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '999px',
    fontSize: '1.1rem',
    fontWeight: 700,
    border: '1px solid rgba(255,255,255,0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    letterSpacing: '0.02em',
    width: '100%',
    maxWidth: '350px'
  },
  features: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  featureCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center',
    transition: 'all 0.3s'
  },
  featureIcon: {
    width: '60px',
    height: '60px',
    background: '#ffe8cc',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    color: '#e85d04'
  },
  featureTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    marginBottom: '8px',
    color: '#0a0a0a',
    letterSpacing: '-0.01em'
  },
  featureDesc: {
    fontSize: '0.95rem',
    color: '#333',
    lineHeight: 1.7,
    letterSpacing: '0.005em',
    fontWeight: 500
  },

  actionSection: {
    maxWidth: '1200px',
    margin: '40px auto 0',
    padding: '40px 20px',
    background: '#fff',
    borderTop: '1px solid #e5e5e5'
  },

  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },

  actionCard: {
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(232, 93, 4, 0.15)',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer',
    color: '#fff',
    border: 'none'
  },

  actionCardHover: {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(232, 93, 4, 0.25)'
  },

  actionIcon: {
    width: '60px',
    height: '60px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    color: '#fff'
  },

  actionTitle: {
    fontSize: '1.1rem',
    fontWeight: 800,
    margin: 0,
    color: '#fff'
  },

  actionDesc: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.85)',
    marginTop: '8px',
    lineHeight: 1.5,
    fontWeight: 500
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },

  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },

  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: 0,
    color: '#0a0a0a'
  },

  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    color: '#666'
  },

  modalInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },

  modalButton: {
    width: '100%',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s'
  },

  starsContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px',
    fontSize: '2rem'
  },

  star: {
    cursor: 'pointer',
    transition: 'transform 0.2s',
    color: '#ddd'
  },

  starActive: {
    color: '#ffc107'
  }
};

export default function Home({ onLogin }) {
  const { tableId } = useParams();
  const [tableName, setTableName] = useState('');
  
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [staffMessage, setStaffMessage] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cash', 'transfer', 'card'

  useEffect(() => {
    if (tableId) {
      const fetchTableInfo = async () => {
        try {
          const response = await axios.get(CUSTOMER_API.GET_TABLE_MENU(tableId));
          if (response.data && response.data.table) {
            setTableName(response.data.table.name);
          }
        } catch (err) {
          console.error('Error fetching table info:', err);
        }
      };
      fetchTableInfo();
    }
  }, [tableId]);

  const handlePrimaryHover = (e, isHover) => {
    if (isHover) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(232, 93, 4, 0.3)';
    } else {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }
  };

  const handleSecondaryHover = (e, isHover) => {
    if (isHover) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
    } else {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
    }
  };

  const handleFeatureHover = (e, isHover) => {
    if (isHover) {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 12px 24px rgba(232, 93, 4, 0.15)';
    } else {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(243, 235, 235, 0.08)';
    }
  };

  const handleStaffSubmit = async () => {
    try {
      const response = await fetch(STAFF_CALL_API.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: staffMessage
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit staff call');
      
      console.log('Gọi nhân viên:', staffMessage);
      alert('Yêu cầu gọi nhân viên đã được gửi!');
      setShowStaffModal(false);
      setStaffMessage('');
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi gửi yêu cầu, vui lòng thử lại!');
    }
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      alert('Vui lòng chọn đánh giá!');
      return;
    }
    
    try {
      const response = await fetch(RATING_API.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stars: rating
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit rating');
      
      console.log('Đánh giá:', rating);
      alert(`Cảm ơn bạn đã đánh giá ${rating} sao!`);
      setShowRatingModal(false);
      setRating(0);
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi gửi đánh giá, vui lòng thử lại!');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      alert('Vui lòng chọn phương thức thanh toán!');
      return;
    }
    
    try {
      const response = await fetch(PAYMENT_REQUEST_API.CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: paymentMethod,
          note: paymentNote
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit payment request');
      
      console.log('Gọi thanh toán:', { method: paymentMethod, note: paymentNote });
      alert(`Yêu cầu thanh toán bằng ${paymentMethod === 'cash' ? 'tiền mặt' : paymentMethod === 'transfer' ? 'chuyển khoản' : 'quẹt thẻ'} đã được gửi!`);
      setShowPaymentModal(false);
      setPaymentNote('');
      setPaymentMethod('');
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi gửi yêu cầu, vui lòng thử lại!');
    }
  };

  return (
    <div style={styles.page}>
      {/* HEADER TOP */}
      <div style={{ background: '#e85d04', color: '#fff', padding: '10px 20px', fontSize: '0.85rem', textAlign: 'center' }}>
        ☎️ 0788606420 | 📧 THTeam@gmail.com
      </div>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <ShoppingCart size={28} />
            <span>OrderFood</span>
          </div>
          <div style={styles.headerLinks}>
            {!tableId && (
              <>
                <Link to="/scan" style={{...styles.headerLink, textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  🔍 Quét QR
                </Link>
                <Link to="/login" style={{...styles.headerLink, textDecoration: 'none'}} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                  👤 Đăng nhập
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            {tableId ? (
              <>
                Xin chào quý khách tại<br/>
                <span style={{ color: '#ffea00', fontSize: '1.2em', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {tableName || `Bàn ${tableId}`}
                </span>
              </>
            ) : (
              <>Đặt Món Nhanh<br/> Chỉ Với Một Cú Quét!🍔🧁</>
            )}
          </h1>
          <p style={styles.heroSubtitle}>
            Hệ thống đặt món thông minh cho nhà hàng. Quét mã QR, chọn món, thanh toán - chỉ trong vài giây!
          </p>
          <div style={{ ...styles.heroButtons, flexDirection: 'column', alignItems: 'center' }}>
            <Link 
              to={tableId ? `/table/${tableId}/menu` : "/scan"}
              style={styles.primaryBtn}
              onMouseEnter={(e) => handlePrimaryHover(e, true)}
              onMouseLeave={(e) => handlePrimaryHover(e, false)}
            >
              <Zap size={20} /> Đặt món ngay
            </Link>
            {!tableId && (
              <Link 
                to="/login"
                style={styles.secondaryBtn}
                onMouseEnter={(e) => handleSecondaryHover(e, true)}
                onMouseLeave={(e) => handleSecondaryHover(e, false)}
              >
                <Star size={20} /> Quản lý nhà hàng
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', gap: '16px' }}>
            <button
              onClick={() => setShowStaffModal(true)}
              style={styles.secondaryBtn}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.25)', transform: 'translateY(-2px)' })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.15)', transform: 'translateY(0)' })}
            >
              <User size={20} /> Gọi Nhân Viên
            </button>

            <button
              onClick={() => setShowRatingModal(true)}
              style={styles.secondaryBtn}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.25)', transform: 'translateY(-2px)' })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.15)', transform: 'translateY(0)' })}
            >
              <Star size={20} /> Đánh Giá
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              style={styles.secondaryBtn}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.25)', transform: 'translateY(-2px)' })}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.15)', transform: 'translateY(0)' })}
            >
              <Phone size={20} /> Gọi Thanh Toán
            </button>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div style={styles.features}>
        <div 
          style={styles.featureCard}
          onMouseEnter={(e) => handleFeatureHover(e, true)}
          onMouseLeave={(e) => handleFeatureHover(e, false)}
        >
          <div style={styles.featureIcon}>
            <Zap size={28} />
          </div>
          <h3 style={styles.featureTitle}>Nhanh Chóng</h3>
          <p style={styles.featureDesc}>Đặt món chỉ trong vài giây, không cần chờ đợi</p>
        </div>

        <div 
          style={styles.featureCard}
          onMouseEnter={(e) => handleFeatureHover(e, true)}
          onMouseLeave={(e) => handleFeatureHover(e, false)}
        >
          <div style={styles.featureIcon}>
            <Clock size={28} />
          </div>
          <h3 style={styles.featureTitle}>Phục Vụ 24/7</h3>
          <p style={styles.featureDesc}>Luôn sẵn sàng phục vụ bạn mọi lúc</p>
        </div>

        <div 
          style={styles.featureCard}
          onMouseEnter={(e) => handleFeatureHover(e, true)}
          onMouseLeave={(e) => handleFeatureHover(e, false)}
        >
          <div style={styles.featureIcon}>
            <ShoppingCart size={28} />
          </div>
          <h3 style={styles.featureTitle}>500+ Món Ăn</h3>
          <p style={styles.featureDesc}>Lựa chọn đa dạng, phong phú cho mọi khẩu vị</p>
        </div>

        <div 
          style={styles.featureCard}
          onMouseEnter={(e) => handleFeatureHover(e, true)}
          onMouseLeave={(e) => handleFeatureHover(e, false)}
        >
          <div style={styles.featureIcon}>
            <Star size={28} />
          </div>
          <h3 style={styles.featureTitle}>Chất Lượng</h3>
          <p style={styles.featureDesc}>Đảm bảo chất lượng tốt nhất cho khách hàng</p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        background: '#f9f9f9',
        borderTop: '1px solid #e5e5e5',
        padding: '40px 20px',
        textAlign: 'center',
        color: '#666',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        lineHeight: 1.6
      }}>
        <p style={{ margin: '0 0 16px', fontSize: '0.95rem' }}>© 2026 OrderFood. Tất cả quyền được bảo lưu.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <a href="#" style={{ color: '#e85d04', textDecoration: 'none', fontWeight: 600 }}>Về chúng tôi</a>
          <a href="#" style={{ color: '#e85d04', textDecoration: 'none', fontWeight: 600 }}>Điều khoản sử dụng</a>
          <a href="#" style={{ color: '#e85d04', textDecoration: 'none', fontWeight: 600 }}>Liên hệ</a>
        </div>
      </div>

      {/* MODAL: Call Staff */}
      {showStaffModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStaffModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Gọi Nhân Viên</h2>
              <button style={styles.closeButton} onClick={() => setShowStaffModal(false)}>
                <X size={24} />
              </button>
            </div>
            <textarea
              style={{ ...styles.modalInput, minHeight: '100px', fontFamily: 'inherit' }}
              placeholder="Nhập nội dung yêu cầu (tùy chọn)..."
              value={staffMessage}
              onChange={(e) => setStaffMessage(e.target.value)}
            />
            <button style={styles.modalButton} onClick={handleStaffSubmit}>
              Gửi Yêu Cầu
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Rating */}
      {showRatingModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRatingModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Đánh Giá Dịch Vụ</h2>
              <button style={styles.closeButton} onClick={() => setShowRatingModal(false)}>
                <X size={24} />
              </button>
            </div>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>Bạn cảm thấy như thế nào về dịch vụ của chúng tôi?</p>
            <div style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    ...styles.star,
                    ...(rating >= star ? styles.starActive : {})
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  ★
                </span>
              ))}
            </div>
            <button style={styles.modalButton} onClick={handleRatingSubmit} disabled={rating === 0}>
              Gửi Đánh Giá
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Payment */}
      {showPaymentModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Gọi Thanh Toán</h2>
              <button style={styles.closeButton} onClick={() => setShowPaymentModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <p style={{ textAlign: 'center', color: '#333', marginBottom: '16px', fontWeight: 600 }}>Chọn phương thức thanh toán:</p>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => setPaymentMethod('cash')}
                style={{
                  padding: '12px 20px',
                  border: '2px solid',
                  borderColor: paymentMethod === 'cash' ? '#e85d04' : '#ddd',
                  background: paymentMethod === 'cash' ? 'rgba(232, 93, 4, 0.1)' : '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: paymentMethod === 'cash' ? '#e85d04' : '#666',
                  transition: 'all 0.3s',
                  fontSize: '0.95rem'
                }}
              >
                💵 Tiền Mặt
              </button>
              
              <button
                onClick={() => setPaymentMethod('transfer')}
                style={{
                  padding: '12px 20px',
                  border: '2px solid',
                  borderColor: paymentMethod === 'transfer' ? '#e85d04' : '#ddd',
                  background: paymentMethod === 'transfer' ? 'rgba(232, 93, 4, 0.1)' : '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: paymentMethod === 'transfer' ? '#e85d04' : '#666',
                  transition: 'all 0.3s',
                  fontSize: '0.95rem'
                }}
              >
                🏦 Chuyển Khoản
              </button>
              
              <button
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '12px 20px',
                  border: '2px solid',
                  borderColor: paymentMethod === 'card' ? '#e85d04' : '#ddd',
                  background: paymentMethod === 'card' ? 'rgba(232, 93, 4, 0.1)' : '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: paymentMethod === 'card' ? '#e85d04' : '#666',
                  transition: 'all 0.3s',
                  fontSize: '0.95rem'
                }}
              >
                💳 Quẹt Thẻ
              </button>
            </div>
            
            <textarea
              style={{ ...styles.modalInput, minHeight: '80px', fontFamily: 'inherit' }}
              placeholder="Ghi chú thêm (tùy chọn)..."
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />
            <button style={{ ...styles.modalButton, opacity: paymentMethod ? 1 : 0.6 }} onClick={handlePaymentSubmit}>
              Yêu Cầu Thanh Toán
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
