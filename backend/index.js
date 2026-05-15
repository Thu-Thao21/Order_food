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

const ORDER_DETAIL_INCLUDE = {
  items: {
    include: {
      menuItem: true,
      addedByUser: { select: { name: true } }
    }
  },
  table: true,
  createdByUser: { select: { id: true, name: true, role: true } },
  paidByUser: { select: { id: true, name: true, role: true } }
};

async function getOrderDetails(orderId) {
  return prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: ORDER_DETAIL_INCLUDE
  });
}

// Helper: kiểm tra nếu tất cả items đã phục vụ
function areAllItemsServed(items) {
  return items && items.length > 0 && items.every(item => item.isServed === true);
}

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
    const { tableId, items, orderType, tableName, userId } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng không được trống' });
    }

    // Verify table exists
    const table = await prisma.table.findUnique({ where: { id: parseInt(tableId) } });
    if (!table) {
      console.error(`❌ Bàn không tồn tại: ${tableId}`);
      return res.status(400).json({ error: `Bàn ${tableId} không tồn tại` });
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: items.map(i => i.menuItemId) } }
    });

    const total = items.reduce((sum, item) => {
      const menu = menuItems.find(m => m.id === item.menuItemId);
      if (!menu) {
        console.error(`❌ Không tìm thấy menu item ID: ${item.menuItemId}`);
        return sum;
      }
      return sum + (menu.price * item.quantity);
    }, 0);

    if (total === 0) {
      return res.status(400).json({ error: 'Không thể tính toán giá tiền. Vui lòng kiểm tra các món ăn.' });
    }

    const existingOrder = await prisma.order.findFirst({
      where: {
        tableId: parseInt(tableId),
        paymentStatus: 'unpaid',
        status: { notIn: ['cancelled', 'completed'] }
      }
    });

    let order;
    if (existingOrder) {
      // Gộp bill: tạo OrderItem mới và update total
      await prisma.orderItem.createMany({
        data: items.map(i => ({
          orderId: existingOrder.id,
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          note: i.note || '',
          addedBy: userId ? parseInt(userId) : null
        }))
      });

      // Fetch updated items to check if all are served
      const updatedItems = await prisma.orderItem.findMany({
        where: { orderId: existingOrder.id },
        include: { menuItem: true, addedByUser: { select: { name: true } } }
      });

      // Nếu order hiện tại đã waiting_payment và tất cả items cũ đều served, giữ waiting_payment; ngược lại đặt pending
      const newStatus = existingOrder.status === 'waiting_payment' && areAllItemsServed(updatedItems) ? 'waiting_payment' : 'pending';

      order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          total: existingOrder.total + total,
          status: newStatus
        },
        include: { 
          items: { include: { menuItem: true, addedByUser: { select: { name: true } } } }, 
          table: true, 
          createdByUser: { select: { id: true, name: true, role: true } } 
        }
      });
      console.log(`✅ Đã gộp đơn hàng: #${order.id}, từ bàn ${order.table?.name}, Tổng mới: ${order.total}₫`);
    } else {
      // Tạo đơn mới
      order = await prisma.order.create({
        data: {
          tableId: parseInt(tableId),
          tableName: tableName || table.name,
          status: 'pending',
          orderType: orderType || 'dine-in',
          paymentStatus: 'unpaid',
          total,
          createdBy: userId ? parseInt(userId) : null,
          items: { 
            create: items.map(i => ({ 
              menuItemId: i.menuItemId, 
              quantity: i.quantity, 
              note: i.note || '',
              addedBy: userId ? parseInt(userId) : null
            })) 
          }
        },
        include: { 
          items: { include: { menuItem: true, addedByUser: { select: { name: true } } } }, 
          table: true, 
          createdByUser: { select: { id: true, name: true, role: true } } 
        }
      });
      console.log(`✅ Đơn hàng mới: #${order.id}, từ bàn ${order.table?.name}, Tạo bởi: ${order.createdByUser?.name || 'Khách'}, Tổng: ${total}₫`);
    }

    // Thông báo cho Bếp + Admin qua Socket.io
    // Chỉ thông báo bếp nếu order có items chưa phục vụ (status pending)
    // Nếu toàn items served (waiting_payment), chỉ cập nhật UI
    if (order.status === 'pending') {
      console.log(`📢 Socket emit: new-order (đơn #${order.id}, pending, bếp phải nấu)`);
      io.emit('new-order', order); // Bếp có công việc mới
    } else {
      console.log(`📢 Socket emit: order-updated (đơn #${order.id}, waiting_payment, chỉ UI)`);
      io.emit('order-updated', order); // Chỉ cập nhật UI
    }
    res.status(201).json(order);
  } catch (error) {
    console.error('❌ Lỗi khi tạo đơn hàng:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật trạng thái thanh toán
app.put('/api/orders/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, paidBy } = req.body;

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: paymentMethod || 'cash',
        paidBy: paidBy ? Number(paidBy) : null,
        status: paymentStatus === 'paid' ? 'completed' : 'pending'
      },
      include: { 
        table: true, 
        items: { include: { menuItem: true } },
        createdByUser: { select: { id: true, name: true, role: true } },
        paidByUser: { select: { id: true, name: true, role: true } }
      }
    });

    // Thông báo cập nhật
    io.emit('order-paid', order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chỉnh sửa món trong đơn mở
app.delete('/api/admin/orders/:orderId/items/:itemId', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const itemId = Number(req.params.itemId);

    const order = await getOrderDetails(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    if (order.paymentStatus !== 'unpaid') {
      return res.status(400).json({ error: 'Chỉ được chỉnh đơn chưa thanh toán' });
    }

    const targetItem = order.items.find((item) => item.id === itemId);
    if (!targetItem) {
      return res.status(404).json({ error: 'Món trong đơn không tồn tại' });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.orderItem.delete({ where: { id: itemId } });

      const remainingItems = await tx.orderItem.findMany({
        where: { orderId },
        include: { menuItem: true, addedByUser: { select: { name: true } } }
      });

      if (remainingItems.length === 0) {
        await tx.order.delete({ where: { id: orderId } });
        return { deleted: true, orderId, tableId: order.tableId };
      }

      // Kiểm tra nếu tất cả items còn lại đều served -> set waiting_payment
      const newStatus = areAllItemsServed(remainingItems) ? 'waiting_payment' : order.status;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          total: remainingItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
          status: newStatus
        },
        include: ORDER_DETAIL_INCLUDE
      });

      return { deleted: false, order: updatedOrder };
    });

    io.emit('order-updated', result.deleted ? { id: orderId, deleted: true } : result.order);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/orders/:orderId/merge', async (req, res) => {
  try {
    const targetOrderId = Number(req.params.orderId);
    const { sourceOrderId } = req.body;

    if (!sourceOrderId) {
      return res.status(400).json({ error: 'Thiếu sourceOrderId' });
    }

    const [targetOrder, sourceOrder] = await Promise.all([
      getOrderDetails(targetOrderId),
      getOrderDetails(sourceOrderId)
    ]);

    if (!targetOrder || !sourceOrder) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng cần gộp' });
    }

    if (targetOrder.paymentStatus !== 'unpaid' || sourceOrder.paymentStatus !== 'unpaid') {
      return res.status(400).json({ error: 'Chỉ gộp các đơn chưa thanh toán' });
    }

    if (targetOrder.id === sourceOrder.id) {
      return res.status(400).json({ error: 'Không thể gộp cùng một đơn hàng' });
    }

    const mergedOrder = await prisma.$transaction(async (tx) => {
      // Copy items từ source sang target, preserve isServed
      await tx.orderItem.createMany({
        data: sourceOrder.items.map((item) => ({
          orderId: targetOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note || '',
          addedBy: item.addedBy || null,
          isServed: item.isServed // Preserve served status
        }))
      });

      // Fetch all items của target sau khi merge
      const allMergedItems = await tx.orderItem.findMany({
        where: { orderId: targetOrder.id },
        include: { menuItem: true, addedByUser: { select: { name: true } } }
      });

      // Kiểm tra nếu tất cả items đều served -> set waiting_payment, không pending
      const newStatus = areAllItemsServed(allMergedItems) ? 'waiting_payment' : targetOrder.status;

      const updatedTarget = await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          total: targetOrder.total + sourceOrder.items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
          status: newStatus
        },
        include: ORDER_DETAIL_INCLUDE
      });

      await tx.order.delete({ where: { id: sourceOrder.id } });

      return updatedTarget;
    });

    console.log(`📝 Socket emit: order-updated (merge, không gửi bếp)`);
    io.emit('order-updated', mergedOrder);
    res.json({ targetOrder: mergedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/orders/:orderId/split', async (req, res) => {
  try {
    const sourceOrderId = Number(req.params.orderId);
    const { tableId, itemIds } = req.body;

    if (!tableId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'Thiếu tableId hoặc danh sách món cần tách' });
    }

    const destinationTableId = Number(tableId);
    const [sourceOrder, destinationTable] = await Promise.all([
      getOrderDetails(sourceOrderId),
      prisma.table.findUnique({ where: { id: destinationTableId } })
    ]);

    if (!sourceOrder) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    if (sourceOrder.paymentStatus !== 'unpaid') {
      return res.status(400).json({ error: 'Chỉ được tách đơn chưa thanh toán' });
    }

    if (!destinationTable) {
      return res.status(404).json({ error: 'Bàn đích không tồn tại' });
    }

    if (destinationTableId === sourceOrder.tableId) {
      return res.status(400).json({ error: 'Vui lòng chọn bàn khác để tách' });
    }

    const selectedIds = itemIds.map(Number);
    const selectedItems = sourceOrder.items.filter((item) => selectedIds.includes(item.id));
    if (selectedItems.length === 0) {
      return res.status(400).json({ error: 'Không có món nào được chọn để tách' });
    }

    const sourceRemainingItems = sourceOrder.items.filter((item) => !selectedIds.includes(item.id));
    const destinationOpenOrder = await prisma.order.findFirst({
      where: {
        tableId: destinationTableId,
        paymentStatus: 'unpaid',
        status: { notIn: ['cancelled', 'completed'] }
      }
    });

    const result = await prisma.$transaction(async (tx) => {
      let targetOrder = destinationOpenOrder;

      if (!targetOrder) {
        targetOrder = await tx.order.create({
          data: {
            tableId: destinationTableId,
            tableName: destinationTable.name,
            status: 'pending',
            orderType: sourceOrder.orderType,
            paymentStatus: 'unpaid',
            total: 0,
            createdBy: sourceOrder.createdBy || null
          },
          include: ORDER_DETAIL_INCLUDE
        });
      }

      // Copy items sang bàn đích, preserve isServed
      await tx.orderItem.createMany({
        data: selectedItems.map((item) => ({
          orderId: targetOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          note: item.note || '',
          addedBy: item.addedBy || null,
          isServed: item.isServed // Preserve served status
        }))
      });

      // Remove moved items from the source order
      await tx.orderItem.deleteMany({ where: { id: { in: selectedIds } } });

      // Re-fetch remaining items from DB to compute source totals reliably
      const remainingDbItems = await tx.orderItem.findMany({
        where: { orderId: sourceOrder.id },
        include: { menuItem: true, addedByUser: { select: { name: true } } }
      });

      // Fetch all items của target sau khi split để kiểm tra status
      const targetAllItems = await tx.orderItem.findMany({
        where: { orderId: targetOrder.id },
        include: { menuItem: true, addedByUser: { select: { name: true } } }
      });

      // Nếu tất cả items đích đều served -> waiting_payment, ngược lại pending
      const targetStatus = areAllItemsServed(targetAllItems) ? 'waiting_payment' : 'pending';

      const updatedTarget = await tx.order.update({
        where: { id: targetOrder.id },
        data: {
          total: (destinationOpenOrder?.total || 0) + selectedItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
          status: targetStatus
        },
        include: ORDER_DETAIL_INCLUDE
      });

      let updatedSource = null;
      if (remainingDbItems.length === 0) {
        await tx.order.delete({ where: { id: sourceOrder.id } });
      } else {
        updatedSource = await tx.order.update({
          where: { id: sourceOrder.id },
          data: {
            total: remainingDbItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0),
            status: sourceOrder.status
          },
          include: ORDER_DETAIL_INCLUDE
        });
      }

      return {
        sourceOrder: updatedSource,
        targetOrder: updatedTarget,
        sourceDeleted: sourceRemainingItems.length === 0
      };
    });

    // Chỉ emit 'order-updated' cho client (UI update), không emit 'new-order' cho bếp nếu order là waiting_payment
    console.log(`📝 Socket emit: order-updated (split, không gửi bếp, chỉ update UI)`);
    io.emit('order-updated', result.targetOrder);
    if (result.sourceOrder) {
      io.emit('order-updated', result.sourceOrder);
    } else {
      io.emit('order-updated', { id: sourceOrderId, deleted: true });
    }

    res.json(result);
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
      include: { table: true, items: { include: { menuItem: true, addedByUser: { select: { name: true } } } }, createdByUser: { select: { id: true, name: true, role: true } } },
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
      include: { table: true, items: { include: { menuItem: true, addedByUser: { select: { name: true } } } }, createdByUser: { select: { id: true, name: true, role: true } } },
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
      include: { 
        table: true, 
        items: { include: { menuItem: true, addedByUser: { select: { name: true } } } }, 
        createdByUser: { select: { id: true, name: true, role: true } },
        paidByUser: { select: { id: true, name: true, role: true } }
      },
      orderBy: { updatedAt: 'desc' }
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
    if (status === 'waiting_payment' || status === 'completed') {
      await prisma.orderItem.updateMany({
        where: { orderId: Number(id), isServed: false },
        data: { isServed: true }
      });
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
      include: { items: { include: { menuItem: true, addedByUser: { select: { name: true } } } }, table: true, createdByUser: { select: { id: true, name: true, role: true } } }
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
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
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
  try {
    const tables = await prisma.table.findMany({
      orderBy: { id: 'asc' },
      include: {
        orders: {
          where: {
            paymentStatus: 'unpaid',
            status: { notIn: ['cancelled', 'completed'] }
          },
          select: { id: true }
        }
      }
    });
    const tablesWithStatus = tables.map(t => ({
      ...t,
      status: t.orders.length > 0 ? 'occupied' : 'empty'
    }));
    res.json(tablesWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === API THANH TOÁN ===
// Lấy danh sách yêu cầu thanh toán (cho quầy)
app.get('/api/payment-requests', async (req, res) => {
  try {
    const paymentRequests = await prisma.paymentRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: { table: true }
    });
    res.json(paymentRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo yêu cầu thanh toán mới
app.post('/api/payment-requests', async (req, res) => {
  try {
    const { method, note, tableId, tableName } = req.body;
    
    if (!method || !['cash', 'transfer', 'card'].includes(method)) {
      return res.status(400).json({ error: 'Phương thức thanh toán không hợp lệ' });
    }
    
    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        method,
        note: note || '',
        status: 'pending',
        tableId: tableId ? Number(tableId) : null,
        tableName: tableName || null
      },
      include: { table: true }
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
      data: { status },
      include: { table: true }
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
      orderBy: { createdAt: 'desc' },
      include: { table: true }
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo đánh giá mới
app.post('/api/ratings', async (req, res) => {
  try {
    const { stars, note, tableId, tableName } = req.body;
    
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Đánh giá phải từ 1-5 sao' });
    }
    
    const rating = await prisma.rating.create({
      data: {
        stars: Number(stars),
        note: note || '',
        status: 'pending',
        tableId: tableId ? Number(tableId) : null,
        tableName: tableName || null
      },
      include: { table: true }
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
      data: { status },
      include: { table: true }
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
      orderBy: { createdAt: 'desc' },
      include: { table: true }
    });
    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo yêu cầu gọi nhân viên
app.post('/api/staff-calls', async (req, res) => {
  try {
    const { message, tableId, tableName } = req.body;
    
    const staffCall = await prisma.staffCall.create({
      data: {
        message: message || '',
        status: 'pending',
        tableId: tableId ? Number(tableId) : null,
        tableName: tableName || null
      },
      include: { table: true }
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
      data: { status },
      include: { table: true }
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

      const existingOrder = await prisma.order.findFirst({
        where: {
          tableId: Number(tableId),
          paymentStatus: 'unpaid',
          status: { notIn: ['cancelled', 'completed'] }
        }
      });

      let order;
      if (existingOrder) {
        await prisma.orderItem.createMany({
          data: items.map(item => ({
            orderId: existingOrder.id,
            menuItemId: Number(item.menuItemId),
            quantity: Number(item.quantity),
            note: item.note || '',
            addedBy: null // Khách order
          }))
        });

        order = await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            total: existingOrder.total + Number(total),
            status: 'pending'
          },
          include: { table: true, items: { include: { menuItem: true, addedByUser: { select: { name: true } } } } }
        });
        console.log(`✅ Đã gộp đơn hàng từ bàn ${order.table?.name || tableId}: #${order.id}`);
      } else {
        // Tạo đơn hàng mới
        order = await prisma.order.create({
          data: {
            tableId: Number(tableId),
            status: 'pending',
            paymentStatus: 'unpaid',
            total: Number(total),
            items: {
              create: items.map(item => ({
                menuItemId: Number(item.menuItemId),
                quantity: Number(item.quantity),
                note: item.note || '',
                addedBy: null // Khách order
              }))
            }
          },
          include: { table: true, items: { include: { menuItem: true, addedByUser: { select: { name: true } } } } }
        });
        console.log(`✅ Đơn hàng mới từ bàn ${order.table?.name || tableId}: #${order.id}`);
      }

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
      const { tableId, tableName, type } = data;

      // Tạo yêu cầu gọi
      const callRequest = await prisma.callRequest.create({
        data: {
          tableId: Number(tableId),
          tableName: tableName || null,
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