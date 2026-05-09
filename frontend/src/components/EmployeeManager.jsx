import { useEffect, useState } from 'react';
import axios from 'axios';
import { ADMIN_USERS_API } from '../config/api';

export default function EmployeeManager() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('cashier');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [employees, setEmployees] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Edit state
  const [editEmp, setEditEmp] = useState(null); // null = không đang sửa
  const [editForm, setEditForm] = useState({ username: '', name: '', role: 'cashier', password: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const getRoleLabel = (value) => {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'cashier') return 'Thu ngân';
    if (normalized === 'kitchen') return 'Bếp';
    return 'Nhân viên';
  };

  const getRoleColor = (value) => {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'admin') return { bg: '#f5f3ff', fg: '#7c3aed', border: '#7c3aed30' };
    if (normalized === 'cashier') return { bg: '#f0f9ff', fg: '#0284c7', border: '#0284c730' };
    if (normalized === 'kitchen') return { bg: '#fff7ed', fg: '#e85d04', border: '#e85d0430' };
    return { bg: '#f8fafc', fg: '#334155', border: '#cbd5e130' };
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingList(true);
      const response = await axios.get(ADMIN_USERS_API.GET_ALL_USERS);
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Lỗi tải danh sách nhân viên:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('');

    if (!username || !password || !name || !role) {
      setMessage('Vui lòng điền đầy đủ thông tin.');
      setMessageType('error');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(ADMIN_USERS_API.CREATE_USER, { username, password, name, role });
      setMessage('Tạo tài khoản nhân viên thành công!');
      setMessageType('success');
      setUsername(''); setPassword(''); setName(''); setRole('cashier');
      await loadEmployees();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorText = error?.response?.data?.error || 'Không thể tạo tài khoản.';
      setMessage(errorText);
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (empId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa?')) return;
    try {
      setDeleteLoading(empId);
      await axios.delete(ADMIN_USERS_API.DELETE_USER(empId));
      setEmployees((prev) => prev.filter((emp) => emp.id !== empId));
      setMessage('Xóa nhân viên thành công!');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Không thể xóa nhân viên');
      setMessageType('error');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleEditOpen = (emp) => {
    setEditEmp(emp);
    setEditForm({ username: emp.username, name: emp.name, role: emp.role, password: '' });
  };

  const handleEditClose = () => {
    setEditEmp(null);
    setEditForm({ username: '', name: '', role: 'cashier', password: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.username || !editForm.name || !editForm.role) {
      setMessage('Vui lòng điền đầy đủ thông tin.');
      setMessageType('error');
      return;
    }
    try {
      setEditSubmitting(true);
      const payload = { username: editForm.username, name: editForm.name, role: editForm.role };
      if (editForm.password) payload.password = editForm.password;
      const res = await axios.put(ADMIN_USERS_API.UPDATE_USER(editEmp.id), payload);
      setEmployees((prev) => prev.map((emp) => emp.id === editEmp.id ? res.data : emp));
      setMessage('Cập nhật nhân viên thành công!');
      setMessageType('success');
      handleEditClose();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Không thể cập nhật nhân viên.');
      setMessageType('error');
    } finally {
      setEditSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e85d0420',
    background: '#fff',
    color: '#0f0e2e',
    width: '100%',
    boxSizing: 'border-box',
    fontSize: '0.95rem',
    fontFamily: '"Times New Roman", Times, serif'
  };

  return (
    <div style={{ display: 'grid', gap: '40px' }}>
      {/* MODAL SỬA NHÂN VIÊN */}
      {editEmp && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid #8b5cf6',
            borderRadius: '24px', padding: '40px',
            width: '100%', maxWidth: '480px',
            boxShadow: '0 30px 80px rgba(139,92,246,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: '800' }}>
                Sửa Nhân Viên
              </h2>
              <button
                onClick={handleEditClose}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(139,92,246,0.1)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.3)' }}>
              <p style={{ margin: 0, color: '#c4b5fd', fontSize: '0.9rem' }}>
                Đang sửa: <strong style={{ color: '#e0e7ff' }}>#{editEmp.id} – {editEmp.username}</strong>
              </p>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Times New Roman", Times, serif' }}>Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Times New Roman", Times, serif' }}>Họ và tên</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Times New Roman", Times, serif' }}>Vai trò</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={inputStyle}
                >
                  <option value="cashier">Thu ngân</option>
                  <option value="kitchen">Bếp</option>
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"Times New Roman", Times, serif' }}>
                  Mật khẩu mới <span style={{ color: '#999', fontWeight: '400', textTransform: 'none' }}>(để trống nếu không đổi)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Nhập mật khẩu mới..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  style={{
                    flex: 1, padding: '13px 20px',
                    background: editSubmitting ? '#e85d0480' : '#e85d04',
                    color: '#fff', border: 'none', borderRadius: '10px',
                    cursor: editSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: '700', fontSize: '1rem',
                    transition: 'all 0.2s',
                    fontFamily: '"Times New Roman", Times, serif'
                  }}
                >
                  {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={handleEditClose}
                  style={{
                    flex: 1, padding: '13px 20px',
                    background: '#f5f5f5',
                    border: '1px solid #ddd',
                    color: '#666', borderRadius: '10px',
                    cursor: 'pointer', fontWeight: '600', fontSize: '1rem',
                    transition: 'all 0.2s',
                    fontFamily: '"Times New Roman", Times, serif'
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* THÔNG BÁO */}
      {message && (
        <div style={{
          padding: '14px 16px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600',
          background: messageType === 'success' ? '#e85d0415' : '#e85d0415',
          border: messageType === 'success' ? '2px solid #e85d04' : '2px solid #e85d04',
          color: messageType === 'success' ? '#e85d04' : '#e85d04',
          fontFamily: '"Times New Roman", Times, serif'
        }}>
          {message}
        </div>
      )}

      {/* FORM TẠO NHÂN VIÊN */}
      <section style={{ background: '#fff', borderRadius: '24px', padding: '40px', color: '#0f0e2e', border: '2px solid #e85d0420', boxShadow: '0 4px 12px rgba(232, 93, 4, 0.08)', fontFamily: '"Times New Roman", Times, serif' }}>
        <h2 style={{ margin: 0, marginBottom: '24px', color: '#e85d04', fontSize: '1.8rem', fontWeight: '800', fontFamily: '"Times New Roman", Times, serif' }}>Tạo Nhân Viên</h2>
        <form style={{ display: 'grid', gap: '16px' }} onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            style={{ padding: '12px', borderRadius: '8px', border: '2px solid #e85d0420', background: '#fff', color: '#0f0e2e', fontFamily: '"Times New Roman", Times, serif' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            style={{ padding: '12px', borderRadius: '8px', border: '2px solid #e85d0420', background: '#fff', color: '#0f0e2e', fontFamily: '"Times New Roman", Times, serif' }}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Họ và tên"
            style={{ padding: '12px', borderRadius: '8px', border: '2px solid #e85d0420', background: '#fff', color: '#0f0e2e', fontFamily: '"Times New Roman", Times, serif' }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '2px solid #e85d0420', background: '#fff', color: '#0f0e2e', fontFamily: '"Times New Roman", Times, serif' }}
          >
            <option value="cashier">Thu ngân</option>
            <option value="kitchen">Bếp</option>
            <option value="staff">Nhân viên</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            style={{ padding: '12px 24px', background: submitting ? '#e85d0480' : '#e85d04', color: '#fff', border: 'none', borderRadius: '8px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: submitting ? 0.7 : 1, fontFamily: '"Times New Roman", Times, serif' }}
          >
            {submitting ? 'Đang tạo...' : 'Tạo Nhân Viên'}
          </button>
        </form>
      </section>

      {/* DANH SÁCH NHÂN VIÊN */}
      <section style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '40px',
        color: '#0f0e2e',
        border: '2px solid #e85d0420',
        boxShadow: '0 4px 12px rgba(232, 93, 4, 0.08)',
        fontFamily: '"Times New Roman", Times, serif'
      }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#e85d04', fontSize: '1.8rem', fontWeight: '800' }}>Danh Sách ({employees.length})</h2>
          <button
            onClick={loadEmployees}
            style={{
              padding: '8px 16px',
              background: '#e85d04',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontFamily: '"Times New Roman", Times, serif',
              boxShadow: '0 2px 8px rgba(232, 93, 4, 0.2)'
            }}
          >
            Làm mới
          </button>
        </div>

        {loadingList ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Đang tải...</p>
        ) : employees.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Chưa có nhân viên</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e85d0420', backgroundColor: '#e85d0408' }}>
                  <th style={{ padding: '15px 12px', textAlign: 'left', color: '#e85d04', fontWeight: '700' }}>ID</th>
                  <th style={{ padding: '15px 12px', textAlign: 'left', color: '#e85d04', fontWeight: '700' }}>Username</th>
                  <th style={{ padding: '15px 12px', textAlign: 'left', color: '#e85d04', fontWeight: '700' }}>Họ Tên</th>
                  <th style={{ padding: '15px 12px', textAlign: 'left', color: '#e85d04', fontWeight: '700' }}>Vai Trò</th>
                  <th style={{ padding: '15px 12px', textAlign: 'left', color: '#e85d04', fontWeight: '700' }}>Ngày Tạo</th>
                  <th style={{ padding: '15px 12px', textAlign: 'center', color: '#e85d04', fontWeight: '700' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: '1px solid #e85d0410',
                      backgroundColor: idx % 2 === 0 ? '#fcfcfc' : '#fff',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e85d0405'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fcfcfc' : '#fff'}
                  >
                    <td style={{ padding: '15px 12px', color: '#666' }}>#{emp.id}</td>
                    <td style={{ padding: '15px 12px', color: '#0f0e2e', fontWeight: '600' }}>{emp.username}</td>
                    <td style={{ padding: '15px 12px', color: '#0f0e2e' }}>{emp.name}</td>
                    <td style={{ padding: '15px 12px' }}>
                      <span style={{
                        background: getRoleColor(emp.role).bg,
                        color: getRoleColor(emp.role).fg,
                        border: `1px solid ${getRoleColor(emp.role).border}`,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '700'
                      }}>
                        {getRoleLabel(emp.role)}
                      </span>
                    </td>
                    <td style={{ padding: '15px 12px', color: '#666' }}>{formatDate(emp.createdAt)}</td>
                    <td style={{ padding: '15px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEditOpen(emp)}
                          style={{
                            background: '#fff',
                            color: '#e85d04',
                            border: '2px solid #e85d04',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            transition: 'all 0.2s',
                            fontFamily: '"Times New Roman", Times, serif'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e85d04';
                            e.currentTarget.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fff';
                            e.currentTarget.style.color = '#e85d04';
                          }}
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          disabled={deleteLoading === emp.id}
                          style={{
                            background: '#fff',
                            color: '#ef4444',
                            border: '2px solid #ef4444',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            cursor: deleteLoading === emp.id ? 'not-allowed' : 'pointer',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            opacity: deleteLoading === emp.id ? 0.7 : 1,
                            transition: 'all 0.2s',
                            fontFamily: '"Times New Roman", Times, serif'
                          }}
                          onMouseEnter={(e) => {
                            if (deleteLoading !== emp.id) {
                              e.currentTarget.style.background = '#ef4444';
                              e.currentTarget.style.color = '#fff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deleteLoading !== emp.id) {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.color = '#ef4444';
                            }

                          }}
                        >
                          {deleteLoading === emp.id ? 'Đang xóa...' : 'Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
