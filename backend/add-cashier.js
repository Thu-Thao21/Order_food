const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function addCashier() {
  const existingCashier = await prisma.user.findFirst({ where: { username: 'cashier' } });
  if (!existingCashier) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.create({
      data: {
        username: 'cashier',
        password: hashedPassword,
        name: 'Thu Ngân 1',
        role: 'cashier'
      }
    });
    console.log('Tạo tài khoản cashier thành công: username: cashier, pass: 123456');
  } else {
    console.log('Tài khoản cashier đã tồn tại');
  }
  await prisma.$disconnect();
}
addCashier().catch(console.error);
