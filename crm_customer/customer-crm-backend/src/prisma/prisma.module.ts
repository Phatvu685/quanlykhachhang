// ============================================================================
// PrismaModule: gói PrismaService lại thành 1 module dùng chung (global),
// để các module khác (Customers, Products...) không cần import lại nhiều lần.
// ============================================================================
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global(): mọi module khác trong app có thể inject PrismaService
// mà KHÔNG cần khai báo "imports: [PrismaModule]" ở từng module con.
@Global()
@Module({
  providers: [PrismaService], // đăng ký PrismaService để NestJS biết cách khởi tạo nó
  exports: [PrismaService], // "xuất" ra ngoài để module khác dùng được qua constructor injection
})
export class PrismaModule {}
