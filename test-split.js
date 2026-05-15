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
    // Tạo đơn mới
    const order = await request('POST', '/api/order', {tableId: 5, items: [{menuItemId: 5, quantity: 1}, {menuItemId: 6, quantity: 1}], orderType: 'dine-in', tableName: 'Ban 5'});
    console.log('1. Đơn mới:', order.body.id, 'Status:', order.body.status, 'Items:', order.body.items.map(i => ({id: i.id, menuItemId: i.menuItemId, isServed: i.isServed})));
    
    const orderId = order.body.id;
    const item1Id = order.body.items[0].id;
    
    // Đánh dấu item 1 là served
    const updateStatus = await request('PATCH', '/api/admin/order/' + orderId + '/status', {status: 'waiting_payment'});
    console.log('2. Update order to waiting_payment, items now:', updateStatus.body.items.map(i => ({id: i.id, menuItemId: i.menuItemId, isServed: i.isServed})));
    
    // Tách item đã served sang bàn 6
    const split = await request('POST', '/api/admin/orders/' + orderId + '/split', {tableId: 6, itemIds: [item1Id]});
    console.log('3. Split result:');
    console.log('   Source order:', split.body.sourceOrder ? {id: split.body.sourceOrder.id, status: split.body.sourceOrder.status, items: split.body.sourceOrder.items.length} : 'deleted');
    console.log('   Target order:', {id: split.body.targetOrder.id, status: split.body.targetOrder.status, items: split.body.targetOrder.items.map(i => ({id: i.id, menuItemId: i.menuItemId, isServed: i.isServed}))});
    
    console.log('\n--- TEST 2: Tách món CHƯA served ---');
    // Tạo đơn mới
    const order2 = await request('POST', '/api/order', {tableId: 7, items: [{menuItemId: 7, quantity: 1}, {menuItemId: 8, quantity: 1}], orderType: 'dine-in', tableName: 'Ban 7'});
    const orderId2 = order2.body.id;
    const item2_1Id = order2.body.items[0].id;
    console.log('1. Đơn mới:', orderId2, 'Status:', order2.body.status, 'Item chưa served');
    
    // Tách item CHƯA served sang bàn 8
    const split2 = await request('POST', '/api/admin/orders/' + orderId2 + '/split', {tableId: 8, itemIds: [item2_1Id]});
    console.log('2. Split result:');
    console.log('   Source order:', split2.body.sourceOrder ? {status: split2.body.sourceOrder.status} : 'deleted');
    console.log('   Target order status:', split2.body.targetOrder.status, '(nên là pending để gửi bếp)');
  } catch (err) {
    console.error('Error:', err);
  }
})();
