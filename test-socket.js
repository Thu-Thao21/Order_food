const http = require('http');

function request(method, path, data) {
  return new Promise((resolve) => {
    const req = http.request({hostname: 'localhost', port: 3000, path, method, headers: {'Content-Type': 'application/json', ...(data ? {'Content-Length': Buffer.byteLength(JSON.stringify(data))} : {})}}, res => {
      let s = '';
      res.on('data', c => s += c);
      res.on('end', () => resolve({status: res.statusCode, body: JSON.parse(s)}));
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    console.log('\n=== TEST: Socket Events (check backend logs) ===\n');
    
    // Test 1: Tạo đơn mới (pending) → emit new-order
    console.log('TEST 1: Tạo đơn mới (pending)');
    console.log('Gọi: POST /api/order, tableId=9, items=[menuItemId 9]');
    const order1 = await request('POST', '/api/order', {
      tableId: 9,
      items: [{menuItemId: 9, quantity: 1}],
      orderType: 'dine-in',
      tableName: 'Ban 9'
    });
    const orderId1 = order1.body.id;
    console.log('✅ Đơn #' + orderId1 + ', status=' + order1.body.status);
    console.log('Kỳ vọng backend: emit new-order (status=pending)\n');
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 2: Thêm món vào đơn pending → emit new-order
    console.log('TEST 2: Thêm món vào đơn pending');
    console.log('Gọi: POST /api/order, tableId=9, items=[menuItemId 10]');
    const add = await request('POST', '/api/order', {
      tableId: 9,
      items: [{menuItemId: 10, quantity: 1}],
      orderType: 'dine-in',
      tableName: 'Ban 9'
    });
    console.log('✅ Đơn #' + add.body.id + ', status=' + add.body.status);
    console.log('Kỳ vọng backend: emit new-order (vẫn pending, có items chưa served)\n');
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 3: Đánh dấu toàn items served → status thành waiting_payment
    console.log('TEST 3: Update order to waiting_payment (tất cả items served)');
    console.log('Gọi: PATCH /api/admin/order/' + orderId1 + '/status, status=waiting_payment');
    const updated = await request('PATCH', '/api/admin/order/' + orderId1 + '/status', {status: 'waiting_payment'});
    console.log('✅ Đơn status=' + updated.body.status);
    console.log('Kỳ vọng backend: emit order-updated (hoặc không emit nếu logic chỉ emit order-updated để cập nhật UI)\n');
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 4: Tách món → emit order-updated
    console.log('TEST 4: Split order');
    const item1Id = order1.body.items[0].id;
    console.log('Gọi: POST /api/admin/orders/' + orderId1 + '/split, tableId=10, itemIds=[' + item1Id + ']');
    const split = await request('POST', '/api/admin/orders/' + orderId1 + '/split', {
      tableId: 10,
      itemIds: [item1Id]
    });
    console.log('✅ Source status=' + (split.body.sourceOrder ? split.body.sourceOrder.status : 'deleted') + ', Target status=' + split.body.targetOrder.status);
    console.log('Kỳ vọng backend: emit order-updated (KHÔNG emit new-order, chỉ cập nhật UI)\n');
    
    await new Promise(r => setTimeout(r, 1500));
    
    console.log('=== Kiểm tra backend terminal để xem socket emit ===');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
