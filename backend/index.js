const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// === CẤU HÌNH LƯU TRỮ ẢNH (MULTER) ===
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Cho phép xem ảnh qua link: http://localhost:3000/uploads/ten-file.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Route mặc định để kiểm tra server
app.get('/', (req, res) => {
  res.send('<h1>Server Order Food đang chạy! 🚀</h1>');
});

// === API AUTH ===
// Đăng nhập
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username và password bắt buộc' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === API CHO KHÁCH HÀNG ===

// Lấy QR code của bàn
app.get('/api/table/:id/qr', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    
    if (!table) {
      return res.status(404).json({ error: 'Bàn không tồn tại' });
    }
    
    res.json({ 
      id: table.id,
      name: table.name,
      qrCode: table.qrCode || `http://localhost:3000/table/${tableId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy Menu theo Bàn (dùng cho trang TableMenu)
app.get('/api/table/:id/menu', async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    const categories = await prisma.category.findMany({
      include: { items: true },
      orderBy: { sort: 'asc' }
    });
    res.json({ table, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Đặt món
app.post('/api/order', async (req, res) => {
  try {
    const { tableId, items, orderType } = req.body;
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map(i => i.menuItemId) } }
    });

    const total = items.reduce((sum, item) => {
      const menu = menuItems.find(m => m.id === item.menuItemId);
      return sum + (menu.price * item.quantity);
    }, 0);

    const order = await prisma.order.create({
      data: {
        tableId,
        status: 'pending',
        orderType: orderType || 'dine-in',
        paymentStatus: 'unpaid',
        total,
        items: { create: items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity, note: i.note })) }
      },
      include: { items: { include: { menuItem: true } }, table: true }
    });

    console.log('✅ Đơn hàng mới:', order.id, 'từ bàn', order.table?.name);
    // Thông báo cho Bếp + Admin qua Socket.io
    io.emit('new-order', order);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật trạng thái thanh toán
app.put('/api/orders/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: paymentMethod || 'cash',
        status: paymentStatus === 'paid' ? 'completed' : 'pending'
      },
      include: { table: true, items: { include: { menuItem: true } } }
    });

    // Thông báo cập nhật
    io.emit('order-paid', order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// === API CHO ADMIN ===

// Lấy danh sách đơn hàng đang chờ (chưa thanh toán hoặc chưa phục vụ)
app.get('/api/admin/orders/pending', async (req, res) => {
  try {
    // Kitchen display: chỉ hiển thị đơn chưa phục vụ (pending/cooking/ready)
    const orders = await prisma.order.findMany({
      where: { 
        status: { in: ['pending', 'Pending', 'Processing', 'processing', 'ready', 'Ready', 'cooking', 'Cooking'] }
      },
      include: { table: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy đơn chờ thanh toán (dùng cho Cashier)
app.get('/api/admin/orders/waiting-payment', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        status: 'waiting_payment'
      },
      include: { table: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy đơn đã hoàn thành (dùng cho Cashier - hoàn thành)
app.get('/api/admin/orders/completed', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        status: 'completed'
      },
      include: { table: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật trạng thái đơn (Served)
app.patch('/api/admin/order/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
      include: { items: { include: { menuItem: true } }, table: true }
    });
    
    // Broadcast status update to all clients
    io.emit('order-status-update', order);
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Lấy danh sách menu items
app.get('/api/admin/menu', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { categoryId: 'asc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === UPLOAD ẢNH ===
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file được tải lên' });
    }
    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, message: 'Tải ảnh thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Tạo món ăn mới
app.post('/api/admin/menu', upload.single('image'), async (req, res) => {
  try {
    const { name, price, categoryId, description, image } = req.body;
    
    const imageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : image; // Nếu không up file thì dùng URL từ request body

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        price: Number(price),
        image: imageUrl,
        description,
        categoryId: Number(categoryId),
        isAvailable: true
      },
      include: { category: true }
    });
    res.status(201).json(menuItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Cập nhật món ăn
app.put('/api/admin/menu/:id', (req, res, next) => {
  // Nếu request là multipart thì dùng multer, ngược lại dùng JSON body bình thường
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('image')(req, res, next);
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, categoryId, description, image } = req.body;

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: name, price, categoryId' });
    }

    const imageUrl = req.file 
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : image;

    const menuItem = await prisma.menuItem.update({
      where: { id: Number(id) },
      data: {
        name,
        price: Number(price),
        image: imageUrl || null,
        description: description || null,
        categoryId: Number(categoryId)
      },
      include: { category: true }
    });
    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Xóa món ăn
app.delete('/api/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.menuItem.delete({ where: { id: Number(id) } });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === API BẾP CẬP NHẬT TRẠNG THÁI HÀNG ===
app.put('/api/menu/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const menuItem = await prisma.menuItem.update({
      where: { id: Number(id) },
      data: { isAvailable: Boolean(isAvailable) }
    });

    console.log(`📦 Cập nhật món: ${menuItem.name} - ${isAvailable ? '✅ Còn hàng' : '❌ Hết hàng'}`);
    
    res.json({ 
      success: true, 
      message: `${menuItem.name} ${isAvailable ? '✅ Còn hàng' : '❌ Hết hàng'}`,
      menuItem 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Lấy danh sách danh mục
app.get('/api/admin/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sort: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Lấy danh sách nhân viên
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Tạo nhân viên mới
app.post('/api/admin/users', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, name, role }
    });
    res.status(201).json({ id: user.id, username: user.username, name: user.name, role: user.role, createdAt: user.createdAt });
  } catch (err) {
    res.status(500).json({ error: 'Tên đăng nhập đã tồn tại hoặc lỗi server' });
  }
});

// 8. Cập nhật nhân viên
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, role, password } = req.body;
    
    const updateData = { username, name, role };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, createdAt: true }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Không thể cập nhật nhân viên' });
  }
});

// 9. Xóa nhân viên
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: 'Xóa nhân viên thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Không thể xóa nhân viên' });
  }
});

// 4. Doanh thu hôm nay
app.get('/api/admin/revenue/daily', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    
    const paidOrders = await prisma.order.findMany({
      where: { 
        paymentStatus: 'paid',
        createdAt: { gte: startOfToday }
      }
    });
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    res.json({ totalRevenue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Thống kê 7 ngày
app.get('/api/admin/revenue/summary', async (req, res) => {
  try {
    const summary = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayOrders = await prisma.order.findMany({
        where: { paymentStatus: 'paid', createdAt: { gte: d, lt: nextD } }
      });

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      summary.push({
        date: `${year}-${month}-${day}`,
        totalRevenue: dayOrders.reduce((sum, o) => sum + o.total, 0)
      });
    }
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Lấy danh sách bàn
app.get('/api/admin/tables', async (req, res) => {
  const tables = await prisma.table.findMany({
    orderBy: { id: 'asc' }
  });
  res.json(tables);
});

// === API THANH TOÁN ===
// Lấy danh sách yêu cầu thanh toán (cho quầy)
app.get('/api/payment-requests', async (req, res) => {
  try {
    const paymentRequests = await prisma.paymentRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(paymentRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo yêu cầu thanh toán mới
app.post('/api/payment-requests', async (req, res) => {
  try {
    const { method, note } = req.body;
    
    if (!method || !['cash', 'transfer', 'card'].includes(method)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }
    
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        method,
        note: note || '',
        status: 'pending'
      }
    });
    
    // Emit event to notify cashier via Socket.io
    io.emit('payment-request-created', paymentRequest);
    
    res.json({ message: 'Yêu cầu thanh toán đã được tạo', data: paymentRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hoàn thành yêu cầu thanh toán
app.put('/api/payment-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    
    const paymentRequest = await prisma.paymentRequest.update({
      where: { id: Number(id) },
      data: { status }
    });
    
    // Emit event to notify
    io.emit('payment-request-updated', paymentRequest);
    
    res.json({ message: 'Cập nhật trạng thái thành công', data: paymentRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === API ĐÁNH GIÁ ===
// Lấy danh sách đánh giá (cho admin)
app.get('/api/ratings', async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo đánh giá mới
app.post('/api/ratings', async (req, res) => {
  try {
    const { stars, note } = req.body;
    
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Đánh giá phải từ 1-5 sao' });
    }
    
    const rating = await prisma.rating.create({
      data: {
        stars: Number(stars),
        note: note || '',
        status: 'pending'
      }
    });
    
    // Emit event to notify admin via Socket.io
    io.emit('new-rating', rating);
    
    res.json({ message: 'Đánh giá đã được lưu', data: rating });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật trạng thái đánh giá
app.put('/api/ratings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const rating = await prisma.rating.update({
      where: { id: Number(id) },
      data: { status }
    });
    
    io.emit('rating-updated', rating);
    
    res.json({ message: 'Cập nhật thành công', data: rating });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === API GỌI NHÂN VIÊN ===
// Lấy danh sách yêu cầu gọi nhân viên (cho quầy)
app.get('/api/staff-calls', async (req, res) => {
  try {
    const calls = await prisma.staffCall.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo yêu cầu gọi nhân viên
app.post('/api/staff-calls', async (req, res) => {
  try {
    const { message } = req.body;
    
    const staffCall = await prisma.staffCall.create({
      data: {
        message: message || '',
        status: 'pending'
      }
    });
    
    // Emit event to notify staff via Socket.io
    io.emit('staff-call-created', staffCall);
    
    res.json({ message: 'Yêu cầu gọi nhân viên đã được gửi', data: staffCall });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hoàn thành yêu cầu gọi nhân viên
app.put('/api/staff-calls/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }
    
    const staffCall = await prisma.staffCall.update({
      where: { id: Number(id) },
      data: { status }
    });
    
    // Emit event to notify
    io.emit('staff-call-updated', staffCall);
    
    res.json({ message: 'Cập nhật trạng thái thành công', data: staffCall });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === SOCKET.IO ===
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Xử lý đặt hàng từ khách hàng
  socket.on('place-order', async (data) => {
    try {
      const { tableId, items, total } = data;

      // Validate
      if (!tableId || !items || items.length === 0) {
        socket.emit('order-error', 'Dữ liệu đơn hàng không hợp lệ');
        return;
      }

      // Tạo đơn hàng
      const order = await prisma.order.create({
        data: {
          tableId: Number(tableId),
          status: 'pending',
          paymentStatus: 'unpaid',
          total: Number(total),
          items: {
            create: items.map(item => ({
              menuItemId: Number(item.menuItemId),
              quantity: Number(item.quantity),
              note: item.note || ''
            }))
          }
        },
        include: { table: true, items: { include: { menuItem: true } } }
      });

      console.log(`✅ Đơn hàng mới từ bàn ${order.table?.name || tableId}: #${order.id}`);

      // Thông báo cho khách hàng rằng đơn đã được gửi
      socket.emit('order-placed-success', order.id);

      // Broadcast đơn mới cho bếp và admin (Socket.io real-time)
      io.emit('new-order', order);
    } catch (error) {
      console.error('Lỗi tạo đơn:', error);
      socket.emit('order-error', 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  });

  // Gọi nhân viên
  socket.on('call-staff', async (data) => {
    try {
      const { tableId, type } = data;

      // Tạo yêu cầu gọi
      const callRequest = await prisma.callRequest.create({
        data: {
          tableId: Number(tableId),
          type: type || 'general',
          status: 'pending'
        },
        include: { table: true }
      });

      console.log(`📞 Khách hàng bàn ${callRequest.table?.name} gọi nhân viên`);

      // Thông báo cho khách hàng
      socket.emit('call-staff-success');

      // Broadcast cho nhân viên/admin
      io.emit('staff-called', callRequest);
    } catch (error) {
      console.error('Lỗi gọi nhân viên:', error);
      socket.emit('call-error', 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    }
  });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend chạy tại http://0.0.0.0:${PORT} (truy cập từ mạng LAN được)`);
});