// ============================================================================
// PrismaService: bọc PrismaClient (thư viện query DB) thành 1 "provider" của
// NestJS, để có thể inject (tiêm) vào bất kỳ service nào khác bằng constructor.
// ============================================================================

// Injectable: đánh dấu class này là 1 provider mà NestJS có thể quản lý vòng đời
// OnModuleInit / OnModuleDestroy: 2 lifecycle hook để tự kết nối/ngắt kết nối DB
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
// PrismaClient: client TypeScript được Prisma tự sinh ra dựa theo schema.prisma
import { PrismaClient } from '@prisma/client';

@Injectable()
// "extends PrismaClient": PrismaService CÓ TẤT CẢ method của PrismaClient
// (this.user, this.customer, this.$transaction...) cộng thêm 2 hook bên dưới.
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Logger riêng để in log có gắn tên "PrismaService", dễ debug hơn console.log
  private readonly logger = new Logger(PrismaService.name);

  // onModuleInit: NestJS tự gọi hàm này NGAY SAU KHI toàn bộ module khởi tạo xong.
  // Ta chủ động mở kết nối tới DB tại đây (thay vì để Prisma tự mở lazy lúc query đầu tiên),
  // để nếu sai DATABASE_URL thì app báo lỗi ngay lúc start, không đợi tới lúc có request.
  async onModuleInit() {
    // "await" vì $connect() là hàm bất đồng bộ (mở TCP connection tới Postgres)
    await this.$connect();
    this.logger.log('Đã kết nối tới PostgreSQL (Neon) thành công.');
  }

  // onModuleDestroy: NestJS tự gọi khi app tắt (Ctrl+C, hoặc container bị kill).
  // Đóng kết nối DB sạch sẽ, tránh rò rỉ connection.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
