import { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_TABLES_API, API_BASE_URL } from '../config/api';

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  background: '#fff', padding: '24px', borderRadius: '12px',
  width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
  fontFamily: '"Times New Roman", Times, serif', color: '#000'
};

const btnStyle = {
  padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: '1rem', flex: 1
};

export function MergeTableModal({ isOpen, onClose, onSuccess }) {
  const [tables, setTables] = useState([]);
  const [sourceTableIds, setSourceTableIds] = useState([]);
  const [targetTableId, setTargetTableId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get(ADMIN_TABLES_API.GET_ALL_TABLES).then(res => setTables(res.data)).catch(console.error);
    } else {
      setSourceTableIds([]);
      setTargetTableId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMerge = async () => {
    if (sourceTableIds.length === 0 || !targetTableId) {
      alert('Vui lòng chọn bàn cần gộp và bàn chính.');
      return;
    }
    if (sourceTableIds.includes(targetTableId)) {
      alert('Bàn chính không được nằm trong danh sách bàn phụ cần gộp.');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post(ADMIN_TABLES_API.MERGE_TABLES, { 
        sourceTableIds: sourceTableIds.map(String), 
        targetTableId: String(targetTableId) 
      });
      alert('Gộp (Nhóm) bàn thành công!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi gộp bàn');
    } finally {
      setLoading(false);
    }
  };

  const toggleSourceTable = (id) => {
    setSourceTableIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const availableTables = tables.filter(t => !t.mergedWithId); // Chỉ hiển thị bàn chưa gộp

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={{ marginTop: 0, color: '#e85d04' }}>Gộp Bàn (Nhóm Bàn)</h2>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Chọn Các Bàn Phụ Cần Gộp:</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '8px', border: '1px solid #ccc', borderRadius: '6px' }}>
            {availableTables.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={sourceTableIds.includes(String(t.id))} 
                  onChange={() => toggleSourceTable(String(t.id))} 
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Vào Bàn Chính:</label>
          <select value={targetTableId} onChange={e => setTargetTableId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px' }}>
            <option value="">-- Chọn bàn chính --</option>
            {availableTables.filter(t => !sourceTableIds.includes(String(t.id))).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ ...btnStyle, background: '#f5f5f5', color: '#333' }} onClick={onClose} disabled={loading}>Hủy</button>
          <button style={{ ...btnStyle, background: '#e85d04', color: '#fff' }} onClick={handleMerge} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Gộp Bàn'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SplitTableModal({ isOpen, onClose, onSuccess }) {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [targetTableId, setTargetTableId] = useState('');
  const [itemsToMove, setItemsToMove] = useState({}); // { orderItemId: quantity }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get(ADMIN_TABLES_API.GET_ALL_TABLES).then(res => setTables(res.data)).catch(console.error);
      // Fetch all active orders
      Promise.all([
        axios.get(`${API_BASE_URL}/admin/orders/pending`),
        axios.get(`${API_BASE_URL}/admin/orders/waiting-payment`)
      ]).then(([res1, res2]) => {
        setOrders([...res1.data, ...res2.data]);
      }).catch(console.error);
    } else {
      setSelectedOrderId('');
      setTargetTableId('');
      setItemsToMove({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedOrder = orders.find(o => o.id === Number(selectedOrderId));

  const handleQtyChange = (itemId, maxQty, value) => {
    const qty = Math.max(0, Math.min(maxQty, Number(value)));
    setItemsToMove(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleSplit = async () => {
    if (!selectedOrderId || !targetTableId) {
      alert('Vui lòng chọn đơn hàng và bàn đích.');
      return;
    }
    if (selectedOrder?.tableId === Number(targetTableId)) {
      alert('Bàn đích phải khác bàn hiện tại.');
      return;
    }

    const payloadItems = Object.entries(itemsToMove)
      .map(([id, qty]) => ({ orderItemId: Number(id), quantity: qty }))
      .filter(i => i.quantity > 0);

    if (payloadItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món để tách.');
      return;
    }

    if (!window.confirm('Bạn có chắc muốn tách các món đã chọn sang bàn mới?')) return;

    try {
      setLoading(true);
      await axios.post(ADMIN_TABLES_API.SPLIT_TABLE, {
        orderId: Number(selectedOrderId),
        targetTableId: Number(targetTableId),
        itemsToMove: payloadItems
      });
      alert('Tách món sang bàn mới thành công!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi tách món');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={{ marginTop: 0, color: '#e85d04' }}>Tách Món Đã Đặt</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Chọn Đơn Hàng Cần Tách Món:</label>
          <select value={selectedOrderId} onChange={e => { setSelectedOrderId(e.target.value); setItemsToMove({}); }} style={{ width: '100%', padding: '10px', borderRadius: '6px' }}>
            <option value="">-- Chọn đơn --</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>
                Đơn #{o.id} - Bàn {o.table?.name || o.tableId} ({o.status})
              </option>
            ))}
          </select>
        </div>

        {selectedOrder && (
          <div style={{ marginBottom: '16px', background: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Chọn món để chuyển đi:</div>
            {selectedOrder.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ flex: 1 }}>{item.menuItem.name} (Max: {item.quantity})</span>
                <input 
                  type="number" 
                  min="0" 
                  max={item.quantity} 
                  value={itemsToMove[item.id] || 0}
                  onChange={(e) => handleQtyChange(item.id, item.quantity, e.target.value)}
                  style={{ width: '60px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Chuyển Sang Bàn (Bàn đích):</label>
          <select value={targetTableId} onChange={e => setTargetTableId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px' }}>
            <option value="">-- Chọn bàn --</option>
            {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ ...btnStyle, background: '#f5f5f5', color: '#333' }} onClick={onClose} disabled={loading}>Hủy</button>
          <button style={{ ...btnStyle, background: '#e85d04', color: '#fff' }} onClick={handleSplit} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Tách Món'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnmergeTableModal({ isOpen, onClose, onSuccess }) {
  const [tables, setTables] = useState([]);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get(ADMIN_TABLES_API.GET_ALL_TABLES).then(res => setTables(res.data)).catch(console.error);
    } else {
      setSelectedTableIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mergedTables = tables.filter(t => t.mergedWithId);

  const handleUnmerge = async () => {
    if (selectedTableIds.length === 0) {
      alert('Vui lòng chọn bàn để tách.');
      return;
    }
    try {
      setLoading(true);
      await axios.post(ADMIN_TABLES_API.UNMERGE_TABLES, { tableIds: selectedTableIds });
      alert('Tách bàn thành công!');
      onSuccess?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi tách bàn');
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (id) => {
    setSelectedTableIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2 style={{ marginTop: 0, color: '#e85d04' }}>Hủy Gộp Bàn (Tách Bàn)</h2>
        <div style={{ marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Chọn Các Bàn Phụ Cần Hủy Gộp:</label>
          {mergedTables.length === 0 ? <p>Không có bàn nào đang gộp.</p> : null}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {mergedTables.map(t => {
              const mainTable = tables.find(tbl => tbl.id === t.mergedWithId);
              return (
                <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedTableIds.includes(String(t.id))} 
                    onChange={() => toggleTable(String(t.id))} 
                  />
                  {t.name} (Gộp vào {mainTable ? mainTable.name : `Bàn ${t.mergedWithId}`})
                </label>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ ...btnStyle, background: '#f5f5f5', color: '#333' }} onClick={onClose} disabled={loading}>Hủy</button>
          <button style={{ ...btnStyle, background: '#e85d04', color: '#fff' }} onClick={handleUnmerge} disabled={loading || mergedTables.length === 0}>
            {loading ? 'Đang xử lý...' : 'Hủy Gộp Bàn'}
          </button>
        </div>
      </div>
    </div>
  );
}
