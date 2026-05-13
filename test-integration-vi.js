/**
 * Bộ Test Tích Hợp - Hệ Thống Order Food
 * Kiểm tra toàn bộ quy trình đặt order: Nhân Viên Phục Vụ → Bếp → Quầy Thu Ngân
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
let testsPassed = 0;
let testsFailed = 0;
let orderId = null;

// Trợ giúp: Yêu cầu HTTP
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${API_BASE}${path}`;
    const url = new URL(fullUrl);
    
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Hàm kiểm tra
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Lỗi: ${err.message}`);
    testsFailed++;
  }
}

// Hàm kiểm tra điều kiện
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} - Mong đợi ${expected}, nhận được ${actual}`);
  }
}

// Bộ kiểm tra
async function runTests() {
  console.log('\n🧪 HỆ THỐNG ORDER FOOD - BỘ KIỂM TRA TÍCH HỢP\n');
  console.log('═'.repeat(60));

  // 1. Kiểm tra Đăng nhập
  await test('Đăng nhập - Tài khoản Thu Ngân', async () => {
    const res = await request('POST', '/auth/login', {
      username: 'cashier1',
      password: 'cashier123'
    });
    assertEqual(res.status, 200, 'Trạng thái đăng nhập');
    assert(res.body.user.id, 'ID Người dùng tồn tại');
    assert(res.body.user.role === 'cashier', 'Vai trò là Thu Ngân');
  });

  await test('Đăng nhập - Tài khoản Bếp', async () => {
    const res = await request('POST', '/auth/login', {
      username: 'kitchen',
      password: 'kitchen123'
    });
    assertEqual(res.status, 200, 'Trạng thái đăng nhập');
    assert(res.body.user.role === 'kitchen', 'Vai trò là Bếp');
  });

  await test('Đăng nhập - Tài khoản Nhân Viên Phục Vụ', async () => {
    const res = await request('POST', '/auth/login', {
      username: 'staff1',
      password: 'staff123'
    });
    assertEqual(res.status, 200, 'Trạng thái đăng nhập');
    assert(res.body.user.role === 'staff', 'Vai trò là Nhân Viên Phục Vụ');
  });

  // 2. Kiểm tra Tạo Order
  await test('Tạo đơn hàng cho bàn', async () => {
    const res = await request('POST', '/order', {
      tableId: 5,
      tableName: 'Bàn 5',
      items: [
        { menuItemId: 1, quantity: 2 },
        { menuItemId: 2, quantity: 1 }
      ],
      orderType: 'dine-in'
    });
    assertEqual(res.status, 201, 'Trạng thái tạo order');
    assert(res.body.id, 'Order có ID');
    assert(res.body.status === 'pending', 'Trạng thái order là đang chờ');
    assert(res.body.total > 0, 'Order có tổng tiền');
    orderId = res.body.id;
  });

  // 3. Kiểm tra View Bếp
  await test('Tải danh sách đơn đang chờ (Bếp)', async () => {
    const res = await request('GET', '/admin/orders/pending');
    assertEqual(res.status, 200, 'Trạng thái tải đơn');
    assert(Array.isArray(res.body), 'Phản hồi là mảng');
    assert(res.body.length > 0, 'Có đơn đang chờ');
    assert(res.body.some(o => o.status === 'pending'), 'Có order với trạng thái đang chờ');
  });

  // 4. Kiểm tra Cập nhật Trạng thái (Bếp đánh dấu xong)
  await test('Cập nhật trạng thái order - từ đang chờ sang chờ thanh toán', async () => {
    const res = await request('PATCH', `/admin/order/${orderId}/status`, {
      status: 'waiting_payment'
    });
    assertEqual(res.status, 200, 'Mã cập nhật trạng thái');
    assertEqual(res.body.status, 'waiting_payment', 'Trạng thái được cập nhật thành chờ thanh toán');
  });

  // 5. Kiểm tra View Quầy (Chờ Thanh Toán)
  await test('Tải danh sách đơn chờ thanh toán (Quầy)', async () => {
    const res = await request('GET', '/admin/orders/waiting-payment');
    assertEqual(res.status, 200, 'Trạng thái tải đơn');
    assert(Array.isArray(res.body), 'Phản hồi là mảng');
    assert(res.body.some(o => o.id === orderId), 'Order được tạo nằm trong danh sách chờ thanh toán');
  });

  // 6. Kiểm tra Xử Lý Thanh Toán
  await test('Xử lý thanh toán', async () => {
    const res = await request('PUT', `/orders/${orderId}/payment`, {
      paymentStatus: 'paid',
      paymentMethod: 'cash'
    });
    assertEqual(res.status, 200, 'Mã trạng thái thanh toán');
    assertEqual(res.body.status, 'completed', 'Trạng thái order là hoàn thành');
    assertEqual(res.body.paymentStatus, 'paid', 'Trạng thái thanh toán là đã thanh toán');
  });

  // 7. Kiểm tra Đơn Đã Hoàn Thành
  await test('Tải danh sách đơn đã hoàn thành', async () => {
    const res = await request('GET', '/admin/orders/completed');
    assertEqual(res.status, 200, 'Trạng thái tải đơn');
    assert(Array.isArray(res.body), 'Phản hồi là mảng');
    assert(res.body.some(o => o.id === orderId), 'Order đã thanh toán nằm trong danh sách hoàn thành');
  });

  // 8. Kiểm tra Yêu Cầu Thanh Toán
  await test('Tạo yêu cầu thanh toán', async () => {
    const res = await request('POST', '/payment-requests', {
      tableId: 6,
      tableName: 'Bàn 6',
      method: 'card',
      note: 'Yêu cầu thanh toán kiểm tra'
    });
    assert(res.status === 201 || res.status === 200, 'Tạo yêu cầu thanh toán');
    assert(res.body.data?.id || res.body.id, 'Yêu cầu thanh toán có ID');
  });

  // 9. Kiểm tra Yêu Cầu Gọi Nhân Viên
  await test('Tạo yêu cầu gọi nhân viên', async () => {
    const res = await request('POST', '/staff-calls', {
      tableId: 7,
      tableName: 'Bàn 7',
      message: 'Cần nước'
    });
    assert(res.status === 201 || res.status === 200, 'Tạo yêu cầu gọi nhân viên');
    assert(res.body.data?.id || res.body.id, 'Yêu cầu gọi nhân viên có ID');
  });

  // 10. Kiểm tra Tải Menu
  await test('Tải danh sách món ăn', async () => {
    const res = await request('GET', '/admin/menu');
    assertEqual(res.status, 200, 'Trạng thái tải menu');
    assert(Array.isArray(res.body), 'Menu là mảng');
    assert(res.body.length > 0, 'Menu có các item');
  });

  // 11. Kiểm tra Người Dùng
  await test('Tải danh sách người dùng', async () => {
    const res = await request('GET', '/admin/users');
    assertEqual(res.status, 200, 'Trạng thái tải người dùng');
    assert(Array.isArray(res.body), 'Người dùng là mảng');
    assert(res.body.length >= 5, 'Có người dùng seed');
  });

  // 12. Kiểm tra Bàn
  await test('Tải danh sách bàn', async () => {
    const res = await request('GET', '/admin/tables');
    assertEqual(res.status, 200, 'Trạng thái tải bàn');
    assert(Array.isArray(res.body), 'Bàn là mảng');
    assert(res.body.length === 20, 'Có 20 bàn');
  });

  // Kết quả
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 KẾT QUẢ KIỂM TRA:`);
  console.log(`   ✅ Thành công: ${testsPassed}`);
  console.log(`   ❌ Thất bại: ${testsFailed}`);
  console.log(`   📈 Tổng cộng: ${testsPassed + testsFailed}`);
  console.log(`   ⚡ Tỷ lệ thành công: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%\n`);

  if (testsFailed === 0) {
    console.log('🎉 TẤT CẢ CÁC BÀI KIỂM TRA ĐÃ THÀNH CÔNG!\n');
    process.exit(0);
  } else {
    console.log('⚠️  MỘT SỐ BÀI KIỂM TRA THẤT BẠI\n');
    process.exit(1);
  }
}

// Kiểm tra nếu các server đang chạy
function checkServers() {
  return Promise.all([
    new Promise(resolve => {
      const req = http.get('http://localhost:3000', res => {
        req.abort();
        resolve(true);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(2000, () => {
        req.abort();
        resolve(false);
      });
    })
  ]);
}

// Main
(async () => {
  const [backendRunning] = await checkServers();

  if (!backendRunning) {
    console.log('❌ Server Backend không chạy trên http://localhost:3000');
    console.log('   Khởi chạy nó với: cd backend && npm run dev\n');
    process.exit(1);
  }

  await runTests();
})();
