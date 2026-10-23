// ============================================================================
// seed.ts: script tạo dữ liệu khởi tạo — PORT lại userSeed trong seedData()
// của bản gốc (5 tài khoản đăng nhập mặc định). Chạy bằng: npm run seed
// ============================================================================
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Danh sách tài khoản mặc định — GIỮ NGUYÊN username/password/role như bản gốc
// để không phá vỡ thói quen đăng nhập hiện tại của người dùng.
const userSeed: Array<{ username: string; password: string; role: 'admin' | 'staff' }> = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'hai_em', password: 'haiem123', role: 'staff' },
  { username: 'ngoc_thuong', password: 'ngocthuong123', role: 'staff' },
  { username: 'ai_thi', password: 'aithi123', role: 'staff' },
  { username: 'tan_phat', password: 'tanphat123', role: 'staff' },
];

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  for (const u of userSeed) {
    // upsert: nếu username đã tồn tại thì bỏ qua/cập nhật, chưa có thì tạo mới
    // -> chạy lại "npm run seed" nhiều lần vẫn AN TOÀN, không bị lỗi trùng khoá.
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {}, // đã tồn tại thì không ghi đè lại (tránh reset password ngoài ý muốn khi seed lại)
      create: { username: u.username, passwordHash, role: u.role },
    });
    console.log(`  ✔ Tài khoản "${u.username}" (${u.role}) sẵn sàng.`);
  }

  console.log('✅ Seed hoàn tất!');
}

main()
  .catch((err) => {
    console.error('❌ Seed lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    // luôn đóng kết nối Prisma khi script kết thúc, tránh treo tiến trình
    await prisma.$disconnect();
  });
