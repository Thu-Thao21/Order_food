import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_TABLES_API } from '../config/api';

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    color: '#0f0e2e',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px'
  },
  header: {
    textAlign: 'center',
    animation: 'fadeIn 0.6s ease-out'
  },
  title: {
    fontSize: 'clamp(2rem, 6vw, 2.8rem)',
    margin: 0,
    marginBottom: '12px',
    fontWeight: 800,
    color: '#0f0e2e',
    lineHeight: 1.2
  },
  subtitle: {
    color: '#666',
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 500
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    width: '100%',
    maxWidth: '800px'
  },
  tableButton: {
    padding: '32px 16px',
    background: '#fff',
    color: '#0f0e2e',
    border: '2px solid #e5e5e5',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 700,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  tableButtonHover: {
    background: '#fff',
    borderColor: '#e85d04',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(232, 93, 4, 0.15)'
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    gridColumn: '1/-1',
    padding: '40px',
    fontSize: '1rem'
  },
  error: {
    textAlign: 'center',
    color: '#dc2626',
    gridColumn: '1/-1',
    padding: '40px',
    fontSize: '1rem'
  },
  backButton: {
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 700,
    marginTop: '24px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(232, 93, 4, 0.2)'
  },
  backButtonHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(232, 93, 4, 0.3)'
  }
};

export default function ScanQR() {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await axios.get(ADMIN_TABLES_API.GET_ALL_TABLES);
        const sortedTables = (res.data || []).sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { numeric: true })
        );
        setTables(sortedTables);
      } catch (err) {
        console.error('Lỗi tải danh sách bàn:', err);
        setTables([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, []);

  const handleSelectTable = (tableId) => {
    console.log('Bàn được chọn:', tableId, 'Type:', typeof tableId);
    navigate(`/table/${tableId}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Chọn Bàn</h1>
        <p style={styles.subtitle}>Chọn bàn của bạn để xem thực đơn và đặt hàng</p>
      </div>

      <div style={styles.grid}>
        {loading ? (
          <div style={styles.loading}>
            Đang tải danh sách bàn...
          </div>
        ) : tables.length === 0 ? (
          <div style={styles.error}>
            Không tìm thấy bàn nào
          </div>
        ) : (
          tables.map(table => (
            <button
              key={table.id}
              onClick={() => handleSelectTable(table.id)}
              style={styles.tableButton}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.tableButtonHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { background: styles.tableButton.background, borderColor: 'rgba(148, 163, 184, 0.12)', transform: 'translateY(0)', boxShadow: 'none' })}
            >
              {table.name || `Bàn ${table.id}`}
            </button>
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        style={styles.backButton}
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.backButtonHover)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' })}
      >
        Quay lại trang chủ
      </button>
    </div>
  );
}
