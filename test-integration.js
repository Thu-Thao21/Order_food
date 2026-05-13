/**
 * Integration Test Suite - Order Food System
 * Tests complete order flow: Staff → Kitchen → Cashier
 */

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
let testsPassed = 0;
let testsFailed = 0;
let orderId = null;

// Helper: HTTP Request (fixed)
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

// Test function
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${err.message}`);
    testsFailed++;
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected ${expected}, got ${actual}`);
  }
}

// Test Suite
async function runTests() {
  console.log('\n🧪 ORDER FOOD SYSTEM - INTEGRATION TESTS\n');
  console.log('═'.repeat(50));

  // 1. Test Auth
  await test('Login - Cashier credentials', async () => {
    const res = await request('POST', '/auth/login', {
      username: 'cashier1',
      password: 'cashier123'
    });
    assertEqual(res.status, 200, 'Auth status');
    assert(res.body.user.id, 'User ID exists');
    assert(res.body.user.role === 'cashier', 'User role is cashier');
  });

  await test('Login - Kitchen credentials', async () => {
    const res = await request('POST', '/auth/login', {
      username: 'kitchen',
      password: 'kitchen123'
    });
    assertEqual(res.status, 200, 'Auth status');
    assert(res.body.user.role === 'kitchen', 'User role is kitchen');
  });

  await test('Login - Staff credentials', async () => {
    const res = await request('POST', '/auth/login', {
      username: 'staff1',
      password: 'staff123'
    });
    assertEqual(res.status, 200, 'Auth status');
    assert(res.body.user.role === 'staff', 'User role is staff');
  });

  // 2. Test Order Creation
  await test('Create order for table', async () => {
    const res = await request('POST', '/order', {
      tableId: 5,
      tableName: 'Bàn 5',
      items: [
        { menuItemId: 1, quantity: 2 },
        { menuItemId: 2, quantity: 1 }
      ],
      orderType: 'dine-in'
    });
    assertEqual(res.status, 201, 'Create order status');
    assert(res.body.id, 'Order has ID');
    assert(res.body.status === 'pending', 'Order status is pending');
    assert(res.body.total > 0, 'Order has total');
    orderId = res.body.id;
  });

  // 3. Test Kitchen View
  await test('Fetch pending orders (Kitchen)', async () => {
    const res = await request('GET', '/admin/orders/pending');
    assertEqual(res.status, 200, 'Fetch pending status');
    assert(Array.isArray(res.body), 'Response is array');
    assert(res.body.length > 0, 'Has pending orders');
    assert(res.body.some(o => o.status === 'pending'), 'Has pending status order');
  });

  // 4. Test Status Update (Kitchen marks done)
  await test('Update order status - pending to waiting_payment', async () => {
    const res = await request('PATCH', `/admin/order/${orderId}/status`, {
      status: 'waiting_payment'
    });
    assertEqual(res.status, 200, 'Update status code');
    assertEqual(res.body.status, 'waiting_payment', 'Status updated to waiting_payment');
  });

  // 5. Test Cashier View (Waiting Payment)
  await test('Fetch waiting-payment orders (Cashier)', async () => {
    const res = await request('GET', '/admin/orders/waiting-payment');
    assertEqual(res.status, 200, 'Fetch waiting-payment status');
    assert(Array.isArray(res.body), 'Response is array');
    assert(res.body.some(o => o.id === orderId), 'Created order in waiting-payment list');
  });

  // 6. Test Payment Processing
  await test('Process payment', async () => {
    const res = await request('PUT', `/orders/${orderId}/payment`, {
      paymentStatus: 'paid',
      paymentMethod: 'cash'
    });
    assertEqual(res.status, 200, 'Payment status code');
    assertEqual(res.body.status, 'completed', 'Order status is completed');
    assertEqual(res.body.paymentStatus, 'paid', 'Payment status is paid');
  });

  // 7. Test Completed Orders
  await test('Fetch completed orders', async () => {
    const res = await request('GET', '/admin/orders/completed');
    assertEqual(res.status, 200, 'Fetch completed status');
    assert(Array.isArray(res.body), 'Response is array');
    assert(res.body.some(o => o.id === orderId), 'Paid order in completed list');
  });

  // 8. Test Payment Requests
  await test('Create payment request', async () => {
    const res = await request('POST', '/payment-requests', {
      tableId: 6,
      tableName: 'Bàn 6',
      method: 'card',
      note: 'Test payment request'
    });
    assert(res.status === 201 || res.status === 200, 'Create payment request');
    assert(res.body.data?.id || res.body.id, 'Payment request has ID');
  });

  // 9. Test Staff Calls
  await test('Create staff call request', async () => {
    const res = await request('POST', '/staff-calls', {
      tableId: 7,
      tableName: 'Bàn 7',
      message: 'Cần nước'
    });
    assert(res.status === 201 || res.status === 200, 'Create staff call');
    assert(res.body.data?.id || res.body.id, 'Staff call has ID');
  });

  // 10. Test Menu Fetch
  await test('Fetch menu items', async () => {
    const res = await request('GET', '/admin/menu');
    assertEqual(res.status, 200, 'Fetch menu status');
    assert(Array.isArray(res.body), 'Menu is array');
    assert(res.body.length > 0, 'Menu has items');
  });

  // 11. Test Users
  await test('Fetch all users', async () => {
    const res = await request('GET', '/admin/users');
    assertEqual(res.status, 200, 'Fetch users status');
    assert(Array.isArray(res.body), 'Users is array');
    assert(res.body.length >= 5, 'Has seed users');
  });

  // 12. Test Tables
  await test('Fetch all tables', async () => {
    const res = await request('GET', '/admin/tables');
    assertEqual(res.status, 200, 'Fetch tables status');
    assert(Array.isArray(res.body), 'Tables is array');
    assert(res.body.length === 20, 'Has 20 tables');
  });

  // Results
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 TEST RESULTS:`);
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📈 Total:  ${testsPassed + testsFailed}`);
  console.log(`   ⚡ Success Rate: ${Math.round(testsPassed / (testsPassed + testsFailed) * 100)}%\n`);

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED\n');
    process.exit(1);
  }
}

// Check if servers are running
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
    console.log('❌ Backend server not running on http://localhost:3000');
    console.log('   Start it with: cd backend && npm run dev\n');
    process.exit(1);
  }

  await runTests();
})();
