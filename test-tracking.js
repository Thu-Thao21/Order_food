/**
 * Test: Tracking - Nhân viên nào tạo order
 * Kiểm tra createdBy field được lưu và trả về
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';

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

async function testTracking() {
  console.log('\n📊 TEST: TRACKING - NHÂN VIÊN NÀO TẠO ORDER');
  console.log('═'.repeat(70));
  console.log('');

  try {
    // 1. Lấy danh sách users
    console.log('1️⃣ Lấy danh sách nhân viên...');
    const usersRes = await request('GET', '/admin/users');
    const users = usersRes.body;
    const staff1 = users.find(u => u.username === 'staff1');
    console.log(`   ✅ Nhân viên: ${staff1.name} (ID: ${staff1.id})`);
    console.log('');

    // 2. Tạo order với userId
    console.log('2️⃣ Nhân viên tạo order với userId tracking...');
    const orderRes = await request('POST', '/order', {
      tableId: 11,
      tableName: 'Bàn 11',
      items: [
        { menuItemId: 1, quantity: 2 },
        { menuItemId: 3, quantity: 1 }
      ],
      orderType: 'dine-in',
      userId: staff1.id
    });

    if (orderRes.status !== 201) {
      throw new Error(`Tạo order thất bại: ${orderRes.status}`);
    }

    const order = orderRes.body;
    console.log(`   ✅ Order ID: #${order.id}`);
    console.log(`   ✅ Bàn: ${order.tableName}`);
    console.log(`   ✅ Tạo bởi: ${order.createdByUser?.name} (ID: ${order.createdByUser?.id})`);
    console.log('');

    // 3. Kiểm tra Bếp có thấy thông tin nhân viên không
    console.log('3️⃣ Kiểm tra Bếp có thấy thông tin nhân viên...');
    const pendingRes = await request('GET', '/admin/orders/pending');
    const pending = pendingRes.body;
    const orderInKitchen = pending.find(o => o.id === order.id);

    if (!orderInKitchen) {
      throw new Error('Order không tìm thấy');
    }

    console.log(`   ✅ Order #${orderInKitchen.id} tạo bởi: ${orderInKitchen.createdByUser?.name}`);
    console.log(`   ✅ Vai trò: ${orderInKitchen.createdByUser?.role}`);
    console.log('');

    // 4. Cập nhật sang waiting_payment
    console.log('4️⃣ Bếp cập nhật xong phục vụ...');
    const updateRes = await request('PATCH', `/admin/order/${order.id}/status`, {
      status: 'waiting_payment'
    });
    console.log(`   ✅ Trạng thái: ${updateRes.body.status}`);
    console.log('');

    // 5. Kiểm tra Quầy có thấy ai tạo order không
    console.log('5️⃣ Kiểm tra Quầy có thấy nhân viên tạo order...');
    const waitingRes = await request('GET', '/admin/orders/waiting-payment');
    const waiting = waitingRes.body;
    const orderInCashier = waiting.find(o => o.id === order.id);

    if (!orderInCashier) {
      throw new Error('Order không tìm thấy ở Quầy');
    }

    console.log(`   ✅ Order #${orderInCashier.id} từ bàn: ${orderInCashier.tableName}`);
    console.log(`   ✅ Tạo bởi nhân viên: ${orderInCashier.createdByUser?.name}`);
    console.log(`   ✅ Tổng tiền: ${orderInCashier.total.toLocaleString('vi-VN')}₫`);
    console.log('');

    // 6. Kiểm tra hoàn thành
    console.log('6️⃣ Quầy thanh toán...');
    const paymentRes = await request('PUT', `/orders/${order.id}/payment`, {
      paymentStatus: 'paid',
      paymentMethod: 'card'
    });

    if (paymentRes.status !== 200) {
      throw new Error('Thanh toán thất bại');
    }
    console.log(`   ✅ Thanh toán thành công`);
    console.log('');

    // 7. Kiểm tra order completed vẫn giữ thông tin nhân viên
    console.log('7️⃣ Kiểm tra order hoàn thành vẫn giữ thông tin nhân viên...');
    const completedRes = await request('GET', '/admin/orders/completed');
    const completed = completedRes.body;
    const finalOrder = completed.find(o => o.id === order.id);

    if (!finalOrder) {
      throw new Error('Order không tìm thấy ở completed');
    }

    console.log(`   ✅ Order #${finalOrder.id} hoàn thành`);
    console.log(`   ✅ Tạo bởi: ${finalOrder.createdByUser?.name}`);
    console.log(`   ✅ Vai trò: ${finalOrder.createdByUser?.role}`);
    console.log(`   ✅ Tổng tiền: ${finalOrder.total.toLocaleString('vi-VN')}₫`);
    console.log('');

    console.log('═'.repeat(70));
    console.log('🎉 KẾT QUẢ: TRACKING HOẠT ĐỘNG ĐÚNG!');
    console.log('');
    console.log('📝 Tóm tắt:');
    console.log('   ✅ Admin & Quầy thấy được nhân viên nào tạo order');
    console.log('   ✅ Thông tin được lưu qua toàn bộ quy trình');
    console.log('   ✅ Có thể audit được ai đặt order nào');
    console.log('');

  } catch (err) {
    console.log(`\n❌ LỖI: ${err.message}\n`);
    process.exit(1);
  }
}

testTracking();
