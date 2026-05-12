import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AUTH_API } from '../config/api';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: '#f5f5f5'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '12px',
    padding: '40px 32px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    animation: 'slideInUp 0.6s ease-out'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '12px'
  },
  title: {
    fontSize: '1.7rem',
    fontWeight: 800,
    color: '#0f0e2e',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: 500
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: '0.03em'
  },
  input: {
    background: '#fff',
    color: '#0f0e2e',
    border: '1.5px solid #e5e5e5',
    padding: '11px 14px',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    transition: 'all 0.2s'
  },
  inputFocus: {
    borderColor: '#e85d04',
    boxShadow: '0 0 0 3px rgba(232, 93, 4, 0.08)',
    background: '#fff'
  },
  button: {
    background: 'linear-gradient(135deg, #e85d04 0%, #d64803 100%)',
    color: '#fff',
    padding: '11px 26px',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.95rem',
    marginTop: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(232, 93, 4, 0.2)'
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    marginTop: '6px'
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#e85d04',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginTop: '20px',
    transition: 'all 0.2s'
  }
};

export default function Login({onLogin}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(AUTH_API.LOGIN, { username, password });
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      const userRole = (res.data.user.role || '').toLowerCase();

      if (userRole === 'admin' || userRole === 'cashier') {
        onLogin(res.data.user);
        navigate('/admin');
      } else if (userRole === 'staff') {
        onLogin(res.data.user);
        navigate('/staff');
      } else {
        onLogin(res.data.user);
        navigate('/kitchen');
      }
    } catch (err) {
      setError('Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (e) => {
    Object.assign(e.target.style, styles.inputFocus);
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = '#e5e5e5';
    e.target.style.boxShadow = 'none';
    e.target.style.background = '#fff';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Đăng nhập</h1>
          <p style={styles.subtitle}>ORDER FOOD</p>
        </div>

        <form style={styles.form} onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tên đăng nhập</label>
            <input
              type="text"
              placeholder="Nhập tên tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              required
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <Link to="/" style={styles.backLink}>
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}