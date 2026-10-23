// ============================================================================
// AppController: route gốc "/" và "/health" — dùng để kiểm tra nhanh server
// đã chạy chưa (ví dụ khi deploy lên Render/Railway, dịch vụ hosting thường
// tự gọi định kỳ 1 route "health" để biết server còn sống).
// ============================================================================
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return this.appService.getInfo();
  }

  @Get('health')
  getHealth() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
