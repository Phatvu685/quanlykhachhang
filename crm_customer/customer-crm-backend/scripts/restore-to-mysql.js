// ============================================================================
// Script khôi phục dữ liệu từ file backup JSON vào cơ sở dữ liệu MySQL
// Hỗ trợ tự động vô hiệu hoá kiểm tra khoá ngoại tạm thời để nạp dữ liệu chính xác
// ============================================================================
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  const backupFile =
    process.argv[2] ||
    path.join(__dirname, '..', 'backups', 'postgres_backup_latest.json');

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Không tìm thấy file backup: ${backupFile}`);
    process.exit(1);
  }

  console.log(`📖 Đang đọc file backup: ${backupFile}`);
  const rawData = fs.readFileSync(backupFile, 'utf-8');
  const backup = JSON.parse(rawData);

  try {
    console.log('🔄 Đang kết nối database MySQL...');

    // Tạm thời tắt kiểm tra khoá ngoại để nạp dữ liệu an toàn
    try {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    } catch (e) {
      // nếu không phải MySQL thì bỏ qua
    }

    console.log('🧹 Xoá dữ liệu cũ nếu có...');
    await prisma.customer.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.stockEntry.deleteMany();
    await prisma.combo.deleteMany();
    await prisma.product.deleteMany();
    await prisma.socialAccount.deleteMany();
    await prisma.user.deleteMany();

    // 1. Users
    console.log(`👤 Đang nạp ${backup.users.length} tài khoản người dùng...`);
    for (const u of backup.users) {
      await prisma.user.create({
        data: {
          id: u.id,
          username: u.username,
          passwordHash: u.passwordHash,
          role: u.role,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        },
      });
    }

    // 2. Products
    console.log(`📦 Đang nạp ${backup.products.length} sản phẩm...`);
    for (const p of backup.products) {
      await prisma.product.create({
        data: {
          id: p.id,
          name: p.name,
          unit: p.unit || 'kg',
          minStock: p.minStock || 0,
          sellPrice: p.sellPrice || 0,
          note: p.note || null,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        },
      });
    }

    // 3. Combos
    console.log(`🎁 Đang nạp ${backup.combos.length} combo...`);
    for (const c of backup.combos) {
      await prisma.combo.create({
        data: {
          id: c.id,
          name: c.name,
          desc: c.desc || null,
          productId: c.productId || null,
          productName: c.productName || null,
          unit: c.unit || 'kg',
          baseKg: c.baseKg || 0,
          unitPrice: c.unitPrice || 0,
          offerType: c.offerType || 'percent',
          offerValue: c.offerValue || 0,
          giftProductId: c.giftProductId || null,
          giftQty: c.giftQty || 0,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        },
      });
    }

    // 4. Stock Entries
    console.log(`📋 Đang nạp ${backup.stockEntries.length} phiếu kho...`);
    for (const s of backup.stockEntries) {
      await prisma.stockEntry.create({
        data: {
          id: s.id,
          type: s.type,
          productId: s.productId,
          qty: s.qty,
          unitPrice: s.unitPrice || 0,
          supplier: s.supplier || null,
          date: s.date || null,
          note: s.note || null,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        },
      });
    }

    // 5. Customers
    console.log(`👥 Đang nạp ${backup.customers.length} khách hàng...`);
    for (const c of backup.customers) {
      await prisma.customer.create({
        data: {
          id: c.id,
          name: c.name,
          phone: c.phone,
          address: c.address || null,
          type: c.type || 'moi',
          note: c.note || null,
          kg: c.kg || 0,
          price: c.price || 0,
          comboId: c.comboId || null,
          staffUserId: c.staffUserId || null,
          productId: c.productId || null,
          stockEntryId: c.stockEntryId || null,
          giftProductId: c.giftProductId || null,
          giftStockEntryId: c.giftStockEntryId || null,
          stage: c.stage || 'order',
          paymentStatus: c.paymentStatus || 'da_tra',
          packed: !!c.packed,
          delivered: !!c.delivered,
          acquiredDate: c.acquiredDate || null,
          lastOrderDate: c.lastOrderDate || null,
          deliveryDate: c.deliveryDate || null,
          nextContactDate: c.nextContactDate || null,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        },
      });
    }

    // 6. Expenses
    console.log(`💰 Đang nạp ${backup.expenses.length} khoản thu chi...`);
    for (const e of backup.expenses) {
      await prisma.expense.create({
        data: {
          id: e.id,
          kind: e.kind,
          name: e.name,
          amount: e.amount || 0,
          date: e.date || null,
          note: e.note || null,
          autoStock: !!e.autoStock,
          stockEntryId: e.stockEntryId || null,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
        },
      });
    }

    // 7. Social Accounts
    console.log(`📱 Đang nạp ${backup.socialAccounts.length} tài khoản mạng xã hội...`);
    for (const a of backup.socialAccounts) {
      await prisma.socialAccount.create({
        data: {
          id: a.id,
          resource: a.resource,
          username: a.username,
          password: a.password,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        },
      });
    }

    try {
      await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (e) {}

    console.log('🎉 KHÔI PHỤC DỮ LIỆU VÀO MYSQL HOÀN TẤT THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ Lỗi khi khôi phục dữ liệu:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
