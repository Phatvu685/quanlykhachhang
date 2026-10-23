const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const userSeed = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'hai_em', password: 'haiem123', role: 'staff' },
  { username: 'ngoc_thuong', password: 'ngocthuong123', role: 'staff' },
  { username: 'ai_thi', password: 'aithi123', role: 'staff' },
  { username: 'tan_phat', password: 'tanphat123', role: 'staff' },
];

async function main() {
  console.log('🌱 Seed tài khoản mặc định...');
  for (const u of userSeed) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, passwordHash, role: u.role },
    });
    console.log(`  ✔ ${u.username}`);
  }
  console.log('✅ Seed hoàn tất');
}

main()
  .catch((err) => {
    console.error('❌ Seed lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
