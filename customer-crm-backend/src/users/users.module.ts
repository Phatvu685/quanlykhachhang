// ============================================================================
// UsersModule: gom Controller + Service của tài nguyên "users" lại thành 1
// module độc lập, rồi được import vào AppModule (module gốc của toàn app).
// ============================================================================
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // export để AuthModule dùng lại UsersService khi xử lý login
})
export class UsersModule {}
