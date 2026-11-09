const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Đang kết nối PostgreSQL...');
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    const products = await prisma.product.findMany({ orderBy: { id: 'asc' } });
    const combos = await prisma.combo.findMany({ orderBy: { id: 'asc' } });
    const stockEntries = await prisma.stockEntry.findMany({ orderBy: { id: 'asc' } });
    const customers = await prisma.customer.findMany({ orderBy: { id: 'asc' } });
    const expenses = await prisma.expense.findMany({ orderBy: { id: 'asc' } });
    const socialAccounts = await prisma.socialAccount.findMany({ orderBy: { id: 'asc' } });

    const data = {
      exportedAt: new Date().toISOString(),
      source: 'postgresql',
      counts: {
        users: users.length,
        products: products.length,
        combos: combos.length,
        stockEntries: stockEntries.length,
        customers: customers.length,
        expenses: expenses.length,
        socialAccounts: socialAccounts.length,
      },
      users,
      products,
      combos,
      stockEntries,
      customers,
      expenses,
      socialAccounts,
    };

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(backupDir, `postgres_backup_${timestamp}.json`);
    const latestPath = path.join(backupDir, `postgres_backup_latest.json`);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    fs.writeFileSync(latestPath, JSON.stringify(data, null, 2), 'utf-8');

    console.log('✅ ĐÃ BACKUP DỮ LIỆU THÀNH CÔNG!');
    console.log('📁 File backup đã lưu tại:', filePath);
    console.log('📊 Số lượng bản ghi:', JSON.stringify(data.counts, null, 2));
  } catch (err) {
    console.error('❌ Lỗi khi backup dữ liệu:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
