import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CUSTOMER_API } from '../config/api';
import './TableMenu.css';

const sectionStyles = {
  page: {
    height: '100vh',
    overflow: 'hidden',
    padding: '0',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
    background: '#fafafa'
  },
  headerTop: {
    background: '#e85d04',
    color: '#fff',
    padding: '10px 20px',
    fontSize: '0.85rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #d64803'
  },
  headerTopContent: {
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pageInner: {
    padding: '24px 20px 24px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden'
  },
  pageContainer: {
    display: 'grid',
    gridTemplateColumns: '6fr 4fr',
    gap: '32px',
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
    flex: 1,
    overflow: 'hidden'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    paddingRight: '6px',
    paddingBottom: '20px'
  },
  header: {
    animation: 'fadeIn 0.6s ease-out',
    flexShrink: 0,
    marginBottom: '8px'
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    lineHeight: 1.05,
    fontWeight: 800,
    color: '#0a0a0a'
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#666',
    maxWidth: '720px',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    fontWeight: 500
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    padding: '6px 12px',
    background: '#fde4d4',
    border: '1px solid #fcc5a5',
    color: '#e85d04',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'capitalize',
    letterSpacing: '0.02em'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '12px',
    scrollBehavior: 'smooth',
    flexShrink: 0,
    marginBottom: '20px'
  },
  tab: {
    flex: '0 0 auto',
    borderRadius: '6px',
    border: '1px solid #e5e5e5',
    background: '#f9f9f9',
    color: '#666',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 600,
    fontSize: '0.9rem',
    backdropFilter: 'none'
  },
  tabActive: {
    background: '#e85d04',
    color: '#fff',
    borderColor: '#e85d04',
    boxShadow: '0 2px 8px rgba(232, 93, 4, 0.2)'
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    paddingBottom: '0',
    borderBottom: 'none'
  },
  cardList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    '@media (max-width: 1400px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (max-width: 1000px)': {
      gridTemplateColumns: 'repeat(2, 1fr)'
    }
  },
  card: {
    background: '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative'
  },
  cardHover: {
    transform: 'translateY(-2px)',
    borderColor: '#d4d4d8',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
  },
  image: {
    width: '100%',
    height: '180px',
    objectFit: 'cover',
    backgroundColor: '#f5f5f5',
    transition: 'all 0.3s ease',
    position: 'relative'
  },
  cardBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: '#ef4444',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
    zIndex: 10
  },
  cardNewBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: '#e85d04',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 700,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  cardBody: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  itemTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.3
  },
  itemDescription: {
    margin: '6px 0 0',
    color: '#666',
    fontSize: '0.8rem',
    lineHeight: 1.4,
    flex: 1,
    fontWeight: 400
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    zIndex: 10
  },
  outOfStockBadge: {
    background: '#dc2626',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '999px',
    fontSize: '0.9rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)'
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginTop: '10px'
  },
  price: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#e85d04'
  },
  addButton: {
    border: 'none',
    borderRadius: '6px',
    background: '#e85d04',
    color: '#fff',
    padding: '6px 10px',
    fontWeight: 700,
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    fontSize: '1rem',
    boxShadow: 'none'
  },
  addButtonHover: {
    transform: 'scale(1.05)',
    background: '#d64803',
    boxShadow: '0 2px 8px rgba(232, 93, 4, 0.2)'
  },
  addButtonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed'
  },
  stickyFooter: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'hidden'
  },
  footerCard: {
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #e5e5e5',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    height: '100%'
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap'
  },
  footerLabel: {
    color: '#999',
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  footerTotal: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#e85d04'
  },
  checkoutButton: {
    border: 'none',
    borderRadius: '6px',
    background: '#e85d04',
    color: '#fff',
    padding: '14px 20px',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
    transition: 'all 0.2s',
    boxShadow: 'none'
  },
  checkoutButtonHover: {
    transform: 'translateY(-1px)',
    background: '#d64803',
    boxShadow: '0 4px 12px rgba(232, 93, 4, 0.25)'
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  toast: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    borderRadius: '8px',
    padding: '12px 24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontWeight: 600,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    animation: 'slideDown 0.3s ease-out',
    background: '#10b981',
    color: '#fff'
  },
  searchBox: {
    width: '100%',
    padding: '12px 16px',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    color: '#1a1a1a',
    fontSize: '0.95rem',
    marginBottom: '20px',
    transition: 'all 0.2s',
    fontWeight: 500
  }
};

const placeholderImage = 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80';

function formatCurrency(value) {
  return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}

function calculateCartTotal(cartItems) {
  return cartItems.reduce((sum, entry) => sum + entry.menuItem.price * entry.quantity, 0);
}

export default function TableMenu() {
  // Light theme only
  const pageBg = '#f5f5f5';
  const textMain = '#0a0a0a';
  const textMuted = '#222';
  const cardBg = '#fff';
  const cardBorderColor = '#e5e5e5';
  const footerBg = '#fff';
  const footerGradient = 'linear-gradient(to top, rgba(245,245,245,0.98), rgba(245,245,245,0.7), transparent)';
  const searchBg = '#fff';
  const searchBorderColor = '#e5e5e5';
  const tabBg = '#f0f4ff';

  const navigate = useNavigate();
  const { tableId: tableIdParam } = useParams();
  const tableId = parseInt(tableIdParam, 10);

  // Debug log
  console.log('TableID từ URL:', tableIdParam, '→ Parsed:', tableId);

  const [tableName, setTableName] = useState('Bàn');
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [orderType, setOrderType] = useState('dine-in');
  const [isCartExpanded, setIsCartExpanded] = useState(false);

  useEffect(() => {
    // Hàm fetch âm thầm (không bật loading spinner, không cuộn lên đầu)
    async function refreshMenu() {
      try {
        const response = await axios.get(CUSTOMER_API.GET_TABLE_MENU(tableId));
        const menuCategories = response.data.categories || [];
        const table = response.data.table;
        if (table && table.name) setTableName(table.name);
        setCategories(menuCategories);
        setActiveCategoryId((prev) => prev || 'all');
      } catch (err) {
        console.error(err);
      }
    }

    // Chỉ hiện loading spinner lần đầu mở trang
    async function fetchMenuFirstLoad() {
      try {
        setLoading(true);
        await refreshMenu();
      } finally {
        setLoading(false);
      }
    }

    fetchMenuFirstLoad();

    // Polling mỗi 5 giây để cập nhật trạng thái hàng — KHÔNG set loading
    const pollInterval = setInterval(refreshMenu, 5000);
    return () => clearInterval(pollInterval);
  }, [tableId]);

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => {
      setMessage('');
      setError('');
    }, 3800);
    return () => clearTimeout(timer);
  }, [message, error]);

  const handleAddToCart = (menuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((entry) => entry.menuItem.id === menuItem.id);
      if (existing) {
        return prevCart.map((entry) =>
          entry.menuItem.id === menuItem.id
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry
        );
      }
      return [...prevCart, { menuItem, quantity: 1, note: '' }];
    });
  };

  const handleNoteChange = (menuItemId, note) => {
    setCart((prevCart) =>
      prevCart.map((entry) =>
        entry.menuItem.id === menuItemId ? { ...entry, note } : entry
      )
    );
  };
  const handleQuantityChange = (menuItemId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((entry) =>
          entry.menuItem.id === menuItemId
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const handleOrder = async () => {
    if (cart.length === 0) {
      setError('Giỏ hàng đang trống. Vui lòng chọn món.');
      return;
    }

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    const payload = {
      tableId: tableId,
      tableName: tableName || (tableId ? `Bàn ${tableId}` : ''),
      orderType: orderType,
      items: cart.map((entry) => ({ menuItemId: entry.menuItem.id, quantity: entry.quantity, note: entry.note || '' })),
      userId: user.id || null
    };

    console.log('Gửi order:', payload);

    try {
      await axios.post(CUSTOMER_API.PLACE_ORDER, payload);
      setMessage('Đặt món thành công!');
      setCart([]);
      setIsCartExpanded(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Đặt món thất bại. Vui lòng thử lại.');
    }
  };

  const cartItemCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartTotal = useMemo(() => calculateCartTotal(cart), [cart]);
  const isAllTab = activeCategoryId === 'all';
  const allItems = useMemo(() => categories.flatMap((cat) => cat.items || []), [categories]);
  const activeCategory = isAllTab
    ? { name: 'Tất cả các món', items: allItems }
    : (categories.find((category) => category.id === activeCategoryId) || categories[0] || {});

  return (
    <main style={sectionStyles.page}>
      {/* HEADER TOP */}
      <div style={sectionStyles.headerTop}>
        <div style={sectionStyles.headerTopContent}>
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
            <span>☎️ 0788606420</span>
            <span>📧 THTeam@gmail.com</span>
          </div>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>← Quay lại</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '80px' }}>Đang tải thực đơn...</div>
      ) : (
        <div style={sectionStyles.pageInner}>
          <div style={sectionStyles.pageContainer} className="responsive-page-container">
            <section style={sectionStyles.mainContent} className="responsive-main-content">
              <header style={sectionStyles.header}>
                <h1 style={sectionStyles.title}>Thực đơn {tableName}</h1>
                <p style={sectionStyles.subtitle}>Chọn các món ăn yêu thích của bạn</p>
              </header>

              {/* Tabs */}
              <div style={sectionStyles.tabs}>
        {/* Tab Tất cả - luôn ở đầu tiên */}
        <button
          key="all"
          type="button"
          onClick={() => setActiveCategoryId('all')}
          style={{
            ...sectionStyles.tab,
            background: activeCategoryId === 'all'
              ? 'linear-gradient(135deg, #e85d04 0%, #f5a868 100%)'
              : tabBg,
            color: activeCategoryId === 'all' ? '#fff' : textMuted,
            ...(activeCategoryId === 'all' ? sectionStyles.tabActive : {})
          }}
        >
          Tất cả
        </button>

        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              style={{
                ...sectionStyles.tab,
                background: isActive
                  ? 'linear-gradient(135deg, #e85d04 0%, #f5a868 100%)'
                  : tabBg,
                color: isActive ? '#fff' : textMuted,
                ...(isActive ? sectionStyles.tabActive : {})
              }}
            >
              {category.name}
            </button>
          );
        })}
              </div>

              {/* Search Bar */}
              <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm món ăn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...sectionStyles.searchBox, background: searchBg, borderColor: searchBorderColor, color: textMain, maxWidth: '500px' }}
                  onFocus={(e) => Object.assign(e.target.style, { borderColor: 'rgba(232, 93, 4, 0.4)', boxShadow: '0 0 0 3px rgba(232, 93, 4, 0.1)' })}
                  onBlur={(e) => Object.assign(e.target.style, { borderColor: searchBorderColor, boxShadow: 'none' })}
                />
              </div>

              {activeCategory ? (
                <div style={{ display: 'grid', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: '0 0 8px', color: '#000', fontSize: '1.25rem', fontWeight: 800 }}>{activeCategory.name}</h2>
                    <p style={{ margin: 0, color: '#333', fontWeight: 600 }}>{(activeCategory.items?.length || 0)} món ăn</p>
                  </div>
                  <div style={sectionStyles.badge}>{(activeCategory.items || []).filter((item) => item.isAvailable).length} còn hàng</div>
                </div>

                {/* Filtered/Searched Items */}
                {(() => {
                  const filteredItems = (activeCategory.items || []).filter(item => {
                    const matchSearch = searchTerm === '' ||
                      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
                    const matchPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
                    return matchSearch && matchPrice;
                  });

                  return (
                    <>
                      {filteredItems.length > 0 ? (
                        <div style={sectionStyles.cardList} className="responsive-card-list">
                          {filteredItems.map((item) => (
                            <article
                              key={item.id}
                              style={{
                                ...sectionStyles.card,
                                background: cardBg,
                                border: `1.5px solid ${cardBorderColor}`,
                                position: 'relative',
                                opacity: !item.isAvailable ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => item.isAvailable && Object.assign(e.currentTarget.style, sectionStyles.cardHover)}
                              onMouseLeave={(e) => item.isAvailable && Object.assign(e.currentTarget.style, { transform: 'translateY(0)', borderColor: 'rgba(148, 163, 184, 0.12)', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)' })}
                            >
                              <img
                                src={item.image || placeholderImage}
                                alt={item.name}
                                style={{ ...sectionStyles.image, filter: !item.isAvailable ? 'grayscale(100%)' : 'none' }}
                              />
                              {/* Badge "Mới" hoặc "Giảm giá" */}
                              {item.isNew && <div style={sectionStyles.cardNewBadge}>✨ MỚI</div>}
                              {item.discount && <div style={sectionStyles.cardBadge}>-{item.discount}%</div>}

                              {/* Badge "Đã hết" */}
                              {!item.isAvailable && (
                                <div style={sectionStyles.outOfStockOverlay}>
                                  <div style={sectionStyles.outOfStockBadge}>Đã hết món</div>
                                </div>
                              )}

                                <div style={sectionStyles.cardBody} className="responsive-card-body">
                                  <div>
                                    <h2 style={{ ...sectionStyles.itemTitle, color: textMain }} className="responsive-item-title">{item.name}</h2>
                                    <p style={{ ...sectionStyles.itemDescription, color: textMuted }}>{item.description || 'Món đặc sắc được chế biến tươi ngon và hấp dẫn.'}</p>
                                  </div>
                                <div style={sectionStyles.itemFooter}>
                                  <div>
                                    <div style={sectionStyles.price}>{formatCurrency(item.price)}</div>
                                    {item.discount && <div style={{ fontSize: '0.8rem', color: '#999', textDecoration: 'line-through' }}>{formatCurrency(item.price * (1 + item.discount / 100))}</div>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(item)}
                                    disabled={!item.isAvailable}
                                    style={{
                                      ...sectionStyles.addButton,
                                      ...(item.isAvailable ? {} : sectionStyles.addButtonDisabled)
                                    }}
                                    onMouseEnter={(e) => item.isAvailable && Object.assign(e.currentTarget.style, sectionStyles.addButtonHover)}
                                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'scale(1)', boxShadow: '0 4px 12px rgba(232, 93, 4, 0.2)' })}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                          Không tìm thấy món nào phù hợp
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Không tìm thấy danh mục.</div>
            )}
          </section>

          {/* Sidebar giỏ hàng */}
          <div style={sectionStyles.stickyFooter} className={`responsive-sticky-footer ${isCartExpanded ? 'expanded' : 'collapsed'}`}>
            <div style={{ ...sectionStyles.footerCard, background: footerBg, border: `1.5px solid ${cardBorderColor}` }} className="responsive-footer-card">
              {/* Tiêu đề Bàn bên phải */}
              <div style={{ paddingBottom: '12px', borderBottom: `1px solid ${cardBorderColor}`, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#f5a868', textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: '0.75rem' }}>
                    Gọi món nhanh
                  </p>
                  <h1 style={{ ...sectionStyles.title, fontSize: '1.6rem', marginBottom: '4px' }}>{tableName}</h1>
                </div>
                <button 
                  className="mobile-cart-toggle"
                  onClick={() => setIsCartExpanded(!isCartExpanded)}
                >
                  {isCartExpanded ? 'Thu gọn ▼' : `Giỏ hàng (${cartItemCount}) ▲`}
                </button>
              </div>

              <div className="collapsible-cart-content">
              {/* Giỏ hàng chi tiết */}
              {cart.length > 0 && (
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${cardBorderColor}` }}>
                  {cart.map((entry) => (
                    <div
                      key={entry.menuItem.id}
                      className="responsive-cart-item"
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={entry.menuItem.image || placeholderImage}
                          alt={entry.menuItem.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid rgba(148, 163, 184, 0.2)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.menuItem.name}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: '#666' }}>
                            {formatCurrency(entry.menuItem.price)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleQuantityChange(entry.menuItem.id, -1)}
                            style={{
                              border: 'none',
                              background: '#ef4444',
                              color: '#fff',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'var(--transition)',
                              padding: 0
                            }}
                            onMouseEnter={(e) => Object.assign(e.target.style, { transform: 'scale(1.1)', background: '#dc2626' })}
                            onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'scale(1)', background: '#ef4444' })}
                          >
                            −
                          </button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, color: '#1a1a1a', fontSize: '1rem' }}>
                            {entry.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(entry.menuItem.id, 1)}
                            style={{
                              border: 'none',
                              background: '#e85d04',
                              color: '#fff',
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'var(--transition)',
                              padding: 0
                            }}
                            onMouseEnter={(e) => Object.assign(e.target.style, { transform: 'scale(1.1)', background: '#d64803' })}
                            onMouseLeave={(e) => Object.assign(e.target.style, { transform: 'scale(1)', background: '#e85d04' })}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      
                      {/* Note Input */}
                      <div style={{ marginTop: '8px' }}>
                        <input
                          type="text"
                          placeholder="Thêm ghi chú (vd: không hành, cay...)"
                          value={entry.note || ''}
                          onChange={(e) => handleNoteChange(entry.menuItem.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e5e5e5',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            outline: 'none',
                            color: '#1a1a1a',
                            background: '#fafafa',
                            transition: 'border-color 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#e85d04'}
                          onBlur={(e) => e.target.style.borderColor = '#e5e5e5'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Thông tin tổng cộng */}
              <div className="responsive-total-info" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', paddingBottom: '12px', borderBottom: `1px solid ${cardBorderColor}`, textAlign: 'right' }}>
                <div>
                  <p style={{ ...sectionStyles.footerLabel, fontSize: '0.7rem' }}>Tổng số món</p>
                  <p style={{ ...sectionStyles.footerTotal, fontSize: '1.1rem' }}>{cartItemCount}</p>
                </div>
                <div>
                  <p style={{ ...sectionStyles.footerLabel, fontSize: '0.7rem' }}>Tổng giá</p>
                  <p style={{ ...sectionStyles.footerTotal, fontSize: '1.1rem' }}>{formatCurrency(cartTotal)}</p>
                </div>
              </div>

              {/* Loại Đơn Hàng */}
              <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', borderBottom: `1px solid ${cardBorderColor}`, paddingBottom: '12px' }}>
                <button
                  onClick={() => setOrderType('dine-in')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: orderType === 'dine-in' ? '2px solid #e85d04' : '1px solid #ddd',
                    background: orderType === 'dine-in' ? '#e85d0415' : '#fff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: orderType === 'dine-in' ? '#e85d04' : '#666',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  🍽️ Ăn tại quán
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: orderType === 'takeaway' ? '2px solid #e85d04' : '1px solid #ddd',
                    background: orderType === 'takeaway' ? '#e85d0415' : '#fff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: orderType === 'takeaway' ? '#e85d04' : '#666',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  🛍️ Mang về
                </button>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                disabled={cart.length === 0}
                className="responsive-checkout-button"
                style={{
                  ...sectionStyles.checkoutButton,
                  marginTop: 'auto',
                  ...(cart.length > 0 ? {} : sectionStyles.checkoutButtonDisabled)
                }}
                onMouseEnter={(e) => cart.length > 0 && Object.assign(e.currentTarget.style, sectionStyles.checkoutButtonHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)' })}
              >
                Đặt món ngay
              </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {(message || error) && (
        <div style={{
          ...sectionStyles.toast,
          background: message ? '#10b981' : '#ef4444'
        }}>
          {message ? '✅' : '❌'} {message || error}
        </div>
      )}
    </main>
  );
}
