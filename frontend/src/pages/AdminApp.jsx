import { useEffect, useState } from 'react';
import axios from 'axios';
import { ADMIN_TABLES_API, ADMIN_USERS_API } from '../config/api';

export default function AdminApp() {
  const [tables, setTables] = useState([]);
  const [users, setUsers] = useState([]);
  const [menuConfig, setMenuConfig] = useState(false);
  const [role, setRole] = useState('cashier');
  
  // Create user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const tableRes = await axios.get(ADMIN_TABLES_API.GET_ALL_TABLES);
    setTables(tableRes.data);
    const userRes = await axios.get(ADMIN_USERS_API.GET_ALL_USERS);
    setUsers(userRes.data);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(ADMIN_USERS_API.CREATE_USER, { username, password, name, role });
      alert('Tạo tài khoản thành công!');
      setUsername('');
      setPassword('');
      setName('');
      setRole('cashier');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi tạo tài khoản');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Quản trị hệ thống (Admin)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Quản lý bàn, menu và cấu hình nhân viên.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '32px' }}>
        <section className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Tạo tài khoản nhân sự</h2>
          <form style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }} onSubmit={handleCreateUser}>
            <input type="text" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'white', flex: 1, minWidth: '150px' }} />
            <input type="password" placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'white', flex: 1, minWidth: '150px' }} />
            <input type="text" placeholder="Tên nhân viên (VD: Nguyễn Văn A)" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'white', flex: 1, minWidth: '150px' }} />
            <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'white', minWidth: '150px' }}>
              <option value="cashier">Thu ngân</option>
              <option value="kitchen">Bếp</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn-primary" style={{ padding: '10px 20px', minWidth: '120px' }}>Tạo Mới</button>
          </form>
          
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text-muted)' }}>Danh sách tài khoản</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {users.map(u => (
                <div key={u.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                   <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                   <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>@{u.username} • {u.role}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Quản lý danh sách bàn & QR Code</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>ID Bàn</th>
                  <th style={{ padding: '12px' }}>Tên hiển thị</th>
                  <th style={{ padding: '12px' }}>Đường dẫn (URL QR Code)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <tr key={table.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>#{table.id}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{table.name || `Bàn ${table.id}`}</td>
                    <td style={{ padding: '12px', color: 'var(--accent)' }}>
                      <a href={`${window.location.origin}/table/${table.id}`} target="_blank" rel="noreferrer">
                         {window.location.origin}/table/{table.id}
                      </a>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-block' }}>Tạo QR In</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '32px' }}>
           <section className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Thống kê (Demo)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Tổng doanh thu hôm nay</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success)' }}>1,450,000đ</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-muted)' }}>Tổng đơn hoàn thành</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>14 đơn</div>
              </div>
            </div>
          </section>

          <section className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Quản lý Menu</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Chỉnh sửa giá, cập nhật hình ảnh và thêm món mới vào hệ thống.</p>
            <button className="btn-primary" onClick={() => setMenuConfig(!menuConfig)}>Vào trình quản lý Món</button>
          </section>
        </div>
      </div>
    </div>
  );
}
