import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { ADMIN_TABLES_API } from '../config/api';

const FRONTEND_URL = 'https://order-food-frontend.onrender.com';

export default function QRCodeManager({ onLogout }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [printMode, setPrintMode] = useState('all');
  const qrRefs = useRef({});

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get(ADMIN_TABLES_API.GET_ALL_TABLES);
      const sortedTables = (res.data || []).sort((a, b) => {
        // Trích xuất số từ tên bàn nếu có (ví dụ "Bàn 1" -> 1)
        const getNumber = (name) => {
          const match = name.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };
        const numA = getNumber(a.name);
        const numB = getNumber(b.name);
        if (numA !== numB) return numA - numB;
        return a.id - b.id;
      });
      setTables(sortedTables);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Lỗi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableId) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId);
    } else {
      newSelected.add(tableId);
    }
    setSelectedTables(newSelected);
  };

  const selectAll = () => {
    if (selectedTables.size === tables.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(tables.map(t => t.id)));
    }
  };

  const downloadQR = (table) => {
    const qrElement = qrRefs.current[table.id];
    if (qrElement) {
      const canvas = qrElement.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_${table.name || `Ban_${table.id}`}.png`;
        link.click();
      }
    }
  };

  const printQR = (table) => {
    const qrElement = qrRefs.current[table.id];
    if (qrElement) {
      const canvas = qrElement.querySelector('canvas');
      if (canvas) {
        const qrImage = canvas.toDataURL('image/png');
        const printWindow = window.open('', '', 'height=600,width=600');
        const appOrigin = FRONTEND_URL;
        const html = `<html><head><title>In ${table.name || `Bàn ${table.id}`}</title><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:white}.container{text-align:center;padding:40px}h1{margin:0 0 20px 0;font-size:24px}img{max-width:300px;border:2px solid #333;margin:20px 0}p{font-size:12px;color:#666}</style></head><body><div class="container"><h1>${table.name || `Bàn ${table.id}`}</h1><img src="${qrImage}" /><p>${appOrigin}/table/${table.id}</p></div></body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
      }
    }
  };

  const printMultiple = () => {
    const tablesToPrint = printMode === 'all' ? tables : tables.filter(t => selectedTables.has(t.id));
    const qrImages = [];

    tablesToPrint.forEach(table => {
      const qrElement = qrRefs.current[table.id];
      if (qrElement) {
        const canvas = qrElement.querySelector('canvas');
        if (canvas) {
          qrImages.push({ table, image: canvas.toDataURL('image/png') });
        }
      }
    });

    const printWindow = window.open('', '', 'height=800,width=1200');
    let html = `<html><head><title>In QR</title><style>body{font-family:Arial;padding:20px;background:white}h1{text-align:center;margin-bottom:30px}.qr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:30px}.qr-card{border:2px solid #ddd;padding:20px;border-radius:8px;background:#fafafa}h3{margin:15px 0;font-size:18px}img{max-width:180px;border:1px solid #ccc}p{font-size:12px;color:#666}</style></head><body><h1>Mã QR - ${new Date().toLocaleDateString('vi-VN')}</h1><div class="qr-grid">`;

    qrImages.forEach(({ table, image }) => {
      html += `<div class="qr-card"><h3>${table.name || `Bàn ${table.id}`}</h3><img src="${image}" /><p>${FRONTEND_URL}/table/${table.id}</p></div>`;
    });

    html += `</div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fafaf8', color: '#e85d04', fontFamily: '"Times New Roman", Times, serif' }}><p>Đang tải...</p></div>;
  }

  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fafaf8', color: '#0f0e2e', fontFamily: '"Times New Roman", Times, serif' }}><div><p style={{ color: '#e85d04' }}>{error}</p><button onClick={fetchTables} style={{ marginTop: '20px', padding: '10px 20px', background: '#e85d04', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: '"Times New Roman", Times, serif' }}>Thử lại</button></div></div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf8', color: '#0f0e2e', padding: '20px', fontFamily: '"Times New Roman", Times, serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#e85d04', fontFamily: '"Times New Roman", Times, serif' }}>Quản lý Mã QR Bàn</h1>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', border: '2px solid #e85d0420', fontFamily: '"Times New Roman", Times, serif' }}>
        <select value={printMode} onChange={(e) => setPrintMode(e.target.value)} style={{ padding: '8px 12px', backgroundColor: '#fff', color: '#0f0e2e', border: '2px solid #e85d0420', borderRadius: '4px', fontFamily: '"Times New Roman", Times, serif' }}>
          <option value="all">Tất cả bàn ({tables.length})</option>
          <option value="selected">Bàn chọn ({selectedTables.size})</option>
        </select>
        <button onClick={printMultiple} disabled={printMode === 'selected' && selectedTables.size === 0} style={{ background: '#e85d04', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', opacity: printMode === 'selected' && selectedTables.size === 0 ? 0.5 : 1, fontFamily: '"Times New Roman", Times, serif', fontWeight: '600' }}>In</button>
        <button onClick={selectAll} style={{ background: '#e85d04', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: '"Times New Roman", Times, serif', fontWeight: '600' }}>{selectedTables.size === tables.length ? 'Bỏ' : 'Chọn'}</button>
        <span style={{ color: '#666', marginLeft: 'auto', fontFamily: '"Times New Roman", Times, serif' }}>Chọn: {selectedTables.size}/{tables.length}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {tables.map(table => (
          <div key={table.id} onClick={() => toggleTable(table.id)} style={{ background: '#fff', border: selectedTables.has(table.id) ? '3px solid #e85d04' : '2px solid #e85d0420', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 2px 8px rgba(232, 93, 4, 0.08)' }}>
            <div ref={(el) => { if (el) qrRefs.current[table.id] = el; }} style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <QRCode value={`${FRONTEND_URL}/table/${table.id}`} size={180} level="H" />
            </div>
            <h3 style={{ margin: '10px 0', fontSize: '1.3rem', color: '#e85d04', fontFamily: '"Times New Roman", Times, serif' }}>{selectedTables.has(table.id) ? '✓ ' : ''}{table.name || `Bàn ${table.id}`}</h3>
            <div style={{ margin: '8px 0' }}>
              {table.status === 'occupied' ? (
                <span style={{ padding: '4px 8px', backgroundColor: '#fff3eb', color: '#e85d04', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>Đang có khách</span>
              ) : (
                <span style={{ padding: '4px 8px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>Bàn trống</span>
              )}
            </div>
            <p style={{ margin: '8px 0', color: '#666', fontSize: '0.9rem', fontFamily: '"Times New Roman", Times, serif' }}>ID: {table.id}</p>
            <p style={{ margin: '8px 0', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', color: '#999', fontSize: '0.85rem', fontFamily: '"Times New Roman", Times, serif' }}>{FRONTEND_URL}/table/{table.id}</p>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button onClick={(e) => { e.stopPropagation(); printQR(table); }} style={{ flex: 1, background: '#e85d04', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontFamily: '"Times New Roman", Times, serif', fontWeight: '600' }}>In</button>
              <button onClick={(e) => { e.stopPropagation(); downloadQR(table); }} style={{ flex: 1, background: '#e85d04', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontFamily: '"Times New Roman", Times, serif', fontWeight: '600' }}>Tải</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', color: '#666', border: '2px solid #e85d0420', fontFamily: '"Times New Roman", Times, serif' }}>
        <h3 style={{ color: '#e85d04', marginTop: 0, fontFamily: '"Times New Roman", Times, serif' }}>Hướng dẫn:</h3>
        <ul style={{ fontFamily: '"Times New Roman", Times, serif' }}><li>Chọn bàn → Nhấp "In" in tất cả</li><li>Hoặc "In" để in riêng</li><li>"Tải" để lưu hình</li></ul>
      </div>
    </div>
  );
}
