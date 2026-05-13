const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu seed data...');

  // Kiểm tra xem đã có data chưa - nếu có bàn rồi thì bỏ qua seed
  const existingTables = await prisma.table.count();
  if (existingTables > 0) {
    console.log(`✅ Database đã có dữ liệu (${existingTables} bàn). Bỏ qua seed.`);
    return;
  }

  // ============ BÀNG =============
  const tablePromises = [];
  for (let i = 1; i <= 20; i++) {
    tablePromises.push(prisma.table.create({ data: { id: i, name: `Bàn ${i}`, qrCode: `${i}` } }));
  }
  const tables = await Promise.all(tablePromises);
  console.log(`✓ Đã tạo ${tables.length} bàn.`);

  // ============ DANH MỤC =============
  const catKhaiVi = await prisma.category.create({ data: { name: 'Khai vị', sort: 1 } });
  const catMonChinh = await prisma.category.create({ data: { name: 'Món chính', sort: 2 } });
  const catNuocUong = await prisma.category.create({ data: { name: 'Nước uống', sort: 3 } });
  const catTrangMieng = await prisma.category.create({ data: { name: 'Tráng miệng', sort: 4 } });
  console.log('✓ Đã tạo 4 danh mục.');

  // ============ MÓN ĂN - TẤT CẢ HÌNH =============
  const menuItems = [
    // Khai vị
    { name: 'Khoai tây chiên', price: 35000, categoryId: catKhaiVi.id, image: '/img/khoaitaychien.jpg', description: 'Chiên giòn, béo ngậy' },
    { name: 'Chả giò', price: 45000, categoryId: catKhaiVi.id, image: '/img/chagio.jpg', description: 'Crispy, ăn kèm nước chấm' },
    { name: 'Bánh cuốn', price: 40000, categoryId: catKhaiVi.id, image: '/img/banhcuon.jpg', description: 'Bánh mềm, đầy đủ nhân' },
    { name: 'Chả trứng', price: 38000, categoryId: catKhaiVi.id, image: '/img/chatrung.jpg', description: 'Chả thơm ngon' },
    { name: 'Nem cua', price: 42000, categoryId: catKhaiVi.id, image: '/img/nem cua.jpg', description: 'Nem cua chiên' },
    { name: 'Gỏi cuốn', price: 35000, categoryId: catKhaiVi.id, image: '/img/goicuon.jpg', description: 'Gỏi cuốn cơm' },
    { name: 'Gỏi ốc', price: 45000, categoryId: catKhaiVi.id, image: '/img/goioc.jpg', description: 'Gỏi ốc tươi' },
    { name: 'Nộm hành', price: 30000, categoryId: catKhaiVi.id, image: '/img/nộm hành.jpeg', description: 'Nộm hành giòn' },
    { name: 'Tôm nhồi thịt cua', price: 50000, categoryId: catKhaiVi.id, image: '/img/tôm nhồi thịt cua.jpg', description: 'Tôm nhồi cua tươi' },

    // Món chính
    { name: 'Phở bò', price: 85000, categoryId: catMonChinh.id, image: '/img/phở bò.jpg', description: 'Nước dùng thơm lừng' },
    { name: 'Phở gà', price: 75000, categoryId: catMonChinh.id, image: '/img/phở gà.jpg', description: 'Gà thơm ngon' },
    { name: 'Cơm tấm', price: 65000, categoryId: catMonChinh.id, image: '/img/comtam.jpg', description: 'Cơm tấm nước mắm' },
    { name: 'Cơm rang', price: 75000, categoryId: catMonChinh.id, image: '/img/comrang.jpg', description: 'Cơm rang chiên xíu' },
    { name: 'Bún bò Huế', price: 85000, categoryId: catMonChinh.id, image: '/img/bunbohue.jpg', description: 'Cay nồn, hấp dẫn' },
    { name: 'Bún riêu', price: 70000, categoryId: catMonChinh.id, image: '/img/bunrieu.jpg', description: 'Nước sôi trừng' },
    { name: 'Bún chả Hà Nội', price: 80000, categoryId: catMonChinh.id, image: '/img/bunchahanoi.jpg', description: 'Bún chả ngon thơm' },
    { name: 'Gà hấm', price: 120000, categoryId: catMonChinh.id, image: '/img/gaham.jpg', description: 'Gà mềm, nước dùng đậm' },
    { name: 'Thịt kho tàu', price: 95000, categoryId: catMonChinh.id, image: '/img/thịt kho tàu.jpg', description: 'Kho tàu cơm' },
    { name: 'Thịt nướng sa tế', price: 105000, categoryId: catMonChinh.id, image: '/img/thịt nướng sa tế.jpg', description: 'Thịt nướng cay thơm' },
    { name: 'Vịt quay', price: 130000, categoryId: catMonChinh.id, image: '/img/vịt quya.jpg', description: 'Vịt quay ngon' },
    { name: 'Vịt nấu tiêu', price: 125000, categoryId: catMonChinh.id, image: '/img/vịt nấu tiêu.jpg', description: 'Vịt nấu tiêu đậm đà' },
    { name: 'Xôi gà', price: 55000, categoryId: catMonChinh.id, image: '/img/xôi gà.jpg', description: 'Xôi dẻo, gà béo' },
    { name: 'Mì xào', price: 65000, categoryId: catMonChinh.id, image: '/img/mì xào.jpg', description: 'Mì xào hỏa tốc' },
    { name: 'Canh chua', price: 50000, categoryId: catMonChinh.id, image: '/img/canhchua.jpg', description: 'Canh chua tươi' },
    { name: 'Canh gà nước', price: 55000, categoryId: catMonChinh.id, image: '/img/canhganuong.jpg', description: 'Canh gà thanh mộc' },
    { name: 'Cua rang me', price: 150000, categoryId: catMonChinh.id, image: '/img/cuarangme.jpg', description: 'Cua rang sốt me' },
    { name: 'Cuốn tôm', price: 48000, categoryId: catMonChinh.id, image: '/img/cuontom.jpg', description: 'Cuốn tôm thanh' },
    { name: 'Chim cút nướng', price: 85000, categoryId: catMonChinh.id, image: '/img/chimcutnuong.jpg', description: 'Chim cút nướng nông' },
    { name: 'Salad tôm', price: 72000, categoryId: catMonChinh.id, image: '/img/salad tôm.jpg', description: 'Salad tôm fresh' },
    { name: 'Tôm nước mắm', price: 78000, categoryId: catMonChinh.id, image: '/img/tôm nước mắm.jpg', description: 'Tôm nước mắm đặc' },
    { name: 'Tôm rang muối', price: 82000, categoryId: catMonChinh.id, image: '/img/tôm rang muối.jpg', description: 'Tôm rang muối giòn' },
    { name: 'Lương nướng', price: 95000, categoryId: catMonChinh.id, image: '/img/lương nướng.jpg', description: 'Lương nướng thơm' },
    { name: 'Ca kho tàu', price: 98000, categoryId: catMonChinh.id, image: '/img/cakho.jpg', description: 'Ca kho tàu nồng' },

    // Bánh
    { name: 'Bánh crepe', price: 45000, categoryId: catTrangMieng.id, image: '/img/banhcrepe2.jpg', description: 'Bánh crepe ngon' },
    { name: 'Bánh crescent', price: 38000, categoryId: catTrangMieng.id, image: '/img/banhcres1.jpg', description: 'Bánh mỳ Pháp' },
    { name: 'Bánh flan', price: 32000, categoryId: catTrangMieng.id, image: '/img/banhflan.jpg', description: 'Bánh flan mềm' },
    { name: 'Bánh muo se', price: 35000, categoryId: catTrangMieng.id, image: '/img/banhmuose.jpg', description: 'Bánh muo se mềm' },
    { name: 'Bánh tir truyền thống', price: 40000, categoryId: catTrangMieng.id, image: '/img/banhtirtruyenthong.jpg', description: 'Bánh tir phần Tây' },
    { name: 'Bánh cheese', price: 42000, categoryId: catTrangMieng.id, image: '/img/banh_cheese.jpg', description: 'Bánh cheese ngọt' },
    { name: 'Bánh chưng', price: 38000, categoryId: catTrangMieng.id, image: '/img/banh_chung.jpg', description: 'Bánh chưng truyền thống' },
    { name: 'Kem', price: 25000, categoryId: catTrangMieng.id, image: '/img/kem.jpg', description: 'Kem ý mát lạnh' },
    { name: 'Kem hạt đen', price: 28000, categoryId: catTrangMieng.id, image: '/img/kemhatde.jpg', description: 'Kem hạt đen thơm' },
    { name: 'Kem sôcola', price: 28000, categoryId: catTrangMieng.id, image: '/img/kemsocola.jpg', description: 'Kem sôcola đen' },
    { name: 'Tiramisu có nước mắm', price: 48000, categoryId: catTrangMieng.id, image: '/img/tira có nước mắm.jpg', description: 'Tiramisu độc lạ' },
    { name: 'Tiramisu không nước mắm', price: 45000, categoryId: catTrangMieng.id, image: '/img/tiramisu k có nc mắm.jpg', description: 'Tiramisu truyền thống' },

    // Nước uống
    { name: 'Bạc xỉu', price: 22000, categoryId: catNuocUong.id, image: '/img/bac_xiu.jpg', description: 'Cà phê sữa đặc, mát' },
    { name: 'Cà phê đen', price: 18000, categoryId: catNuocUong.id, image: '/img/cfden.jpg', description: 'Cà phê đen đậm' },
    { name: 'Cà phê sữa', price: 20000, categoryId: catNuocUong.id, image: '/img/cfsua.jpg', description: 'Cà phê sữa ngon' },
    { name: 'Cà phê sữa đá', price: 22000, categoryId: catNuocUong.id, image: '/img/cfsuada.jpg', description: 'Cà phê sữa đá lạnh' },
    { name: 'Trà vải', price: 20000, categoryId: catNuocUong.id, image: '/img/trà vải.jpg', description: 'Trà vải tươi mát' },
    { name: 'Trà xanh đá', price: 18000, categoryId: catNuocUong.id, image: '/img/trà xanh đa.jpg', description: 'Trà xanh đá lạnh' },
    { name: 'Nước cam', price: 25000, categoryId: catNuocUong.id, image: '/img/nước cam.jpg', description: 'Cam tươi mát' },
    { name: 'Nước cam dâu', price: 28000, categoryId: catNuocUong.id, image: '/img/nước cam dâu.jpg', description: 'Cam dâu tây' },
    { name: 'Nước dâu tây', price: 26000, categoryId: catNuocUong.id, image: '/img/nước dâu tây.jpg', description: 'Dâu tây tươi' },
    { name: 'Nước dừa', price: 24000, categoryId: catNuocUong.id, image: '/img/nước dừa.jpg', description: 'Dừa tươi mang mát' },
    { name: 'Nước mía', price: 20000, categoryId: catNuocUong.id, image: '/img/nước mía.jpg', description: 'Mía tươi ngon' },
    { name: 'Nước mắm', price: 15000, categoryId: catNuocUong.id, image: '/img/nước mắm.jpg', description: 'Nước mắm chuẩn' },
    { name: 'Sinh tố xoài', price: 28000, categoryId: catNuocUong.id, image: '/img/sinh tố xoài.jpg', description: 'Xoài tươi, béo ngậy' },
    { name: 'Bia HN', price: 35000, categoryId: catNuocUong.id, image: '/img/biaHN.jpg', description: 'Bia Hà Nội lạnh' },
    { name: 'Bia SG', price: 36000, categoryId: catNuocUong.id, image: '/img/BiaSG.jpg', description: 'Bia Sài Gòn' },
    { name: 'Chè ba màu', price: 22000, categoryId: catNuocUong.id, image: '/img/chebamau.jpg', description: 'Chè ba màu tươi' },
    { name: 'Chè chuối', price: 20000, categoryId: catNuocUong.id, image: '/img/chechuoi.jpg', description: 'Chè chuối thanh' },
    { name: 'Chè đậu đỏ', price: 21000, categoryId: catNuocUong.id, image: '/img/cheddaudo.jpg', description: 'Chè đậu đỏ mát' },
    { name: 'Hầu nướng', price: 32000, categoryId: catNuocUong.id, image: '/img/haunuong.jpg', description: 'Hầu nướng nước mắm' },
  ];

  await prisma.menuItem.createMany({ data: menuItems });
  console.log(`✓ Đã tạo ${menuItems.length} món ăn.`);

  // ============ USERS (NHÂN VIÊN) =============
  const hashedPasswords = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('cashier123', 10),
    bcrypt.hash('staff123', 10),
    bcrypt.hash('staff123', 10),
    bcrypt.hash('kitchen123', 10),
  ]);

  const users = await Promise.all([
    prisma.user.create({
      data: { username: 'admin', password: hashedPasswords[0], name: 'Admin', role: 'admin' }
    }),
    prisma.user.create({
      data: { username: 'cashier1', password: hashedPasswords[1], name: 'Thu ngân 1', role: 'cashier' }
    }),
    prisma.user.create({
      data: { username: 'staff1', password: hashedPasswords[2], name: 'Nhân viên 1', role: 'staff' }
    }),
    prisma.user.create({
      data: { username: 'staff2', password: hashedPasswords[3], name: 'Nhân viên 2', role: 'staff' }
    }),
    prisma.user.create({
      data: { username: 'kitchen', password: hashedPasswords[4], name: 'Bếp', role: 'kitchen' }
    }),
  ]);
  console.log(`✓ Đã tạo ${users.length} tài khoản nhân viên.`);

  console.log('\n✅ Seed dữ liệu HOÀN TẤT!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
