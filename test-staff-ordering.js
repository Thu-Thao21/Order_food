/**
 * Test: Nhân Viên Order Cho Bàn
 * Kiểm tra toàn bộ quy trình staff tạo order
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

async function testStaffOrdering() {
  console.log('\n👨‍💼 TEST: NHÂN VIÊN ORDER CHO BÀN');
  console.log('═'.repeat(60));
  console.log('');

  try {
    // 1. Tạo order cho Bàn 10
    console.log('1️⃣ Nhân viên tạo order cho Bàn 10...');
    const orderRes = await request('POST', '/order', {
      tableId: 10,
      tableName: 'Bàn 10',
      items: [
        { menuItemId: 3, quantity: 2 },  // Salad
        { menuItemId: 5, quantity: 1 },  // Steak
        { menuItemId: 8, quantity: 2 }   // Nước
      ],
      orderType: 'dine-in'
    });

    if (orderRes.status !== 201) {
      throw new Error(`Tạo order thất bại: ${orderRes.status}`);
    }

    const order = orderRes.body;
    console.log(`   ✅ Order ID: #${order.id}`);
    console.log(`   ✅ Bàn: ${order.tableName}`);
    console.log(`   ✅ Trạng thái: ${order.status}`);
    console.log(`   ✅ Tổng tiền: ${order.total.toLocaleString('vi-VN')}₫`);
    console.log(`   ✅ Số món: ${order.items.length} (${order.items.map(i => i.quantity).join('+')}) = ${order.items.reduce((s,i) => s + i.quantity, 0)} cái`);
    console.log('');

    // 2. Kiểm tra Bếp có thấy order không
    console.log('2️⃣ Kiểm tra Bếp có nhận order không...');
    const pendingRes = await request('GET', '/admin/orders/pending');
    const pending = pendingRes.body;
    const foundInKitchen = pending.find(o => o.id === order.id);

    if (foundInKitchen) {
      console.log(`   ✅ Bếp THẤY order #${foundInKitchen.id}`);
      console.log(`   ✅ Trạng thái: ${foundInKitchen.status}`);
      console.log(`   ✅ Bàn: ${foundInKitchen.tableName}`);
      console.log(`   ✅ Số món: ${foundInKitchen.items.length}`);
    } else {
      throw new Error('❌ Bếp KHÔNG thấy order!');
    }
    console.log('');

    // 3. Bếp cập nhật trạng thái sang "chờ thanh toán"
    console.log('3️⃣ Bếp cập nhật: Xong phục vụ...');
    const updateRes = await request('PATCH', `/admin/order/${order.id}/status`, {
      status: 'waiting_payment'
    });

    if (updateRes.status !== 200) {
      throw new Error(`Cập nhật thất bại: ${updateRes.status}`);
    }

    const updated = updateRes.body;
    console.log(`   ✅ Trạng thái cập nhật: ${updated.status}`);
    console.log('');

    // 4. Kiểm tra Quầy có thấy order không
    console.log('4️⃣ Kiểm tra Quầy có thấy order chờ thanh toán...');
    const waitingRes = await request('GET', '/admin/orders/waiting-payment');
    const waiting = waitingRes.body;
    const foundInCashier = waiting.find(o => o.id === order.id);

    if (foundInCashier) {
      console.log(`   ✅ Quầy THẤY order #${foundInCashier.id}`);
      console.log(`   ✅ Tổng tiền: ${foundInCashier.total.toLocaleString('vi-VN')}₫`);
      console.log(`   ✅ Bàn: ${foundInCashier.tableName}`);
    } else {
      throw new Error('❌ Quầy KHÔNG thấy order!');
    }
    console.log('');

    // 5. Quầy xử lý thanh toán
    console.log('5️⃣ Quầy xử lý thanh toán...');
    const paymentRes = await request('PUT', `/orders/${order.id}/payment`, {
      paymentStatus: 'paid',
      paymentMethod: 'cash'
    });

    if (paymentRes.status !== 200) {
      throw new Error(`Thanh toán thất bại: ${paymentRes.status}`);
    }

    const paid = paymentRes.body;
    console.log(`   ✅ Trạng thái: ${paid.status}`);
    console.log(`   ✅ Thanh toán: ${paid.paymentStatus}`);
    console.log(`   ✅ Phương thức: ${paid.paymentMethod === 'cash' ? 'Tiền Mặt' : paid.paymentMethod}`);
    console.log('');

    // 6. Kiểm tra order đã hoàn thành
    console.log('6️⃣ Kiểm tra order ở danh sách hoàn thành...');
    const completedRes = await request('GET', '/admin/orders/completed');
    const completed = completedRes.body;
    const foundCompleted = completed.find(o => o.id === order.id);

    if (foundCompleted) {
      console.log(`   ✅ Order #${foundCompleted.id} đã HOÀN THÀNH`);
      console.log(`   ✅ Bàn: ${foundCompleted.tableName}`);
    } else {
      throw new Error('❌ Order không ở danh sách hoàn thành!');
    }
    console.log('');

    console.log('═'.repeat(60));
    console.log('🎉 KẾT QUẢ: NHÂN VIÊN CÓ THỂ ORDER CHO BÀN ĐƯỢC ĐỦ!');
    console.log('');
    console.log('📊 Tóm tắt quy trình:');
    console.log('   1️⃣ Nhân viên tạo order → ✅ Thành công');
    console.log('   2️⃣ Bếp nhận order → ✅ Hiển thị');
    console.log('   3️⃣ Bếp cập nhật xong → ✅ Trạng thái đổi');
    console.log('   4️⃣ Quầy nhận order → ✅ Hiển thị');
    console.log('   5️⃣ Quầy thanh toán → ✅ Hoàn thành');
    console.log('   6️⃣ Order lưu hoàn thành → ✅ Tìm thấy');
    console.log('');
    console.log('✅ TOÀN BỘ QUY TRÌNH HOẠT ĐỘNG ĐÚNG!\n');

  } catch (err) {
    console.log(`\n❌ LỖI: ${err.message}\n`);
    process.exit(1);
  }
}

testStaffOrdering();
