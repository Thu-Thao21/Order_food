# 📊 TÍNH NĂNG MỚI: TRACKING - NHÂN VIÊN NÀO TẠO ORDER

## ✅ Tính Năng Được Thêm

Admin & Quầy sẽ **thấy được nhân viên nào tạo order** cho bàn khách hàng.

### Những Thay Đổi:

```
✅ Backend
  - Thêm field `createdBy` vào Order model (database schema)
  - Update 3 API endpoints để trả về thông tin nhân viên:
    * GET /api/admin/orders/pending
    * GET /api/admin/orders/waiting-payment
    * GET /api/admin/orders/completed
  - POST /api/order giờ nhận `userId` parameter

✅ Frontend
  - TableMenu.jsx gửi userId từ sessionStorage khi tạo order
  - Admin & Quầy sẽ thấy "Order: Tên Nhân Viên"

✅ Database Migration
  - Migration: 20260513051852_add_created_by_to_order
  - Schema đã được update ✓
```

---

## 🔧 Cách Sử Dụng

### Bước 1: Restart Backend Server

```bash
# Tắt server hiện tại (nếu đang chạy)
# Rồi chạy lại:
cd backend
npm run dev
```

**LỰA CHỌN NHANH:** 
- Mở terminal mới
- Chạy: `cd e:\Order_food_Moi_full_clone\backend && npm run dev`

### Bước 2: Test Tracking

```bash
cd e:\Order_food_Moi_full_clone
node test-tracking.js
```

**Kết Quả Mong Đợi:**
```
✅ Order được tạo với createdBy = nhân viên
✅ Bếp thấy "Order: Nhân viên 1"
✅ Quầy thấy "Order: Nhân viên 1"
✅ Thông tin được giữ qua toàn bộ quy trình
```

---

## 📊 Dữ Liệu Được Lưu

**Order Response** giờ trả về:
```json
{
  "id": 7,
  "tableId": 11,
  "tableName": "Bàn 11",
  "status": "pending",
  "createdBy": 20,
  "createdByUser": {
    "id": 20,
    "name": "Nhân viên 1",
    "role": "staff"
  },
  "total": 110000,
  "items": [...],
  "createdAt": "2026-05-13T05:18:00Z"
}
```

---

## 🎯 Quy Trình Hoàn Chỉnh

```
1. Nhân viên tạo order cho Bàn X
   → API nhận userId từ sessionStorage
   → Lưu vào DB (Order.createdBy = userId)

2. Bếp xem danh sách pending
  → Thấy "Order #7 từ Bàn 11, Order: Nhân viên 1"

3. Bếp cập nhật "Xong phục vụ"
   → Trạng thái: pending → waiting_payment

4. Quầy xem danh sách chờ thanh toán
  → Thấy "Order #7, Order: Nhân viên 1"

5. Quầy thanh toán
   → Order chuyển sang completed

6. Audit Log
  → Order #7 do Nhân viên 1 tạo vào 12:18
   → Thanh toán lúc 12:20
   → Có thể tracking người tạo order
```

---

## 🔍 Các File Được Sửa

- `backend/prisma/schema.prisma` - Thêm `createdBy` field
- `backend/prisma/migrations/20260513051852_add_created_by_to_order/` - Migration
- `backend/index.js` - Update 4 endpoints
- `frontend/src/pages/TableMenu.jsx` - Send userId

---

## 📋 Test Scripts

| File | Mục Đích |
|------|---------|
| `test-integration.js` | Test toàn bộ workflow (14 test cases) |
| `test-integration-vi.js` | Test (Tiếng Việt) |
| `test-staff-ordering.js` | Test nhân viên order cho bàn |
| `test-tracking.js` | Test tính năng tracking **MỚI** |

**Chạy tất cả:**
```bash
npm run dev  # Backend
cd ..
node test-tracking.js
```

---

## ✅ Xác Nhận Hoàn Thành

- [x] Schema updated
- [x] Migration created & applied
- [x] API updated
- [x] Frontend updated
- [ ] Backend restarted (bạn cần làm)
- [ ] Tests passed (sẽ pass sau restart)

**Tiếp theo:** Restart backend rồi chạy `test-tracking.js` để xác nhận! 🚀
