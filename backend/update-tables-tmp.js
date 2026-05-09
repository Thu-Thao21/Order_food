const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu cập nhật danh sách bàn...');

  // Lấy tất cả các bàn hiện tại
  const existingTables = await prisma.table.findMany({
    orderBy: { id: 'asc' }
  });

  console.log(`Tìm thấy ${existingTables.length} bàn hiện tại.`);

  let tableCount = 1;
  const tablesToKeep = [];

  // Giữ lại tối đa 20 bàn và đổi tên thành "Bàn 1" đến "Bàn 20"
  for (const table of existingTables) {
    if (tableCount <= 20) {
      const newName = `Bàn ${tableCount}`;
      await prisma.table.update({
        where: { id: table.id },
        data: { name: newName, qrCode: `${tableCount}` }
      });
      console.log(`Đã cập nhật bàn ID ${table.id} thành ${newName}`);
      tablesToKeep.push(table.id);
      tableCount++;
    } else {
      // Xoá các bàn thừa (ví dụ bàn VIP hoặc bàn số > 20)
      await prisma.table.delete({
        where: { id: table.id }
      });
      console.log(`Đã xoá bàn thừa ID ${table.id} (${table.name})`);
    }
  }

  // Nếu số lượng bàn hiện tại ít hơn 20, thêm các bàn còn thiếu
  while (tableCount <= 20) {
    const newName = `Bàn ${tableCount}`;
    await prisma.table.create({
      data: { name: newName, qrCode: `${tableCount}` }
    });
    console.log(`Đã tạo mới ${newName}`);
    tableCount++;
  }

  console.log('Hoàn tất! Hiện có chính xác 20 bàn (Bàn 1 -> Bàn 20).');
}

main()
  .catch(e => {
    console.error('Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
