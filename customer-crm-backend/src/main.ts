// ============================================================================
// main.ts: điểm khởi động (entry point) của toàn bộ ứng dụng NestJS.
// Chạy bằng lệnh "npm run start" (hoặc "npm run start:dev" lúc code).
// ============================================================================
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  // Tạo 1 instance ứng dụng NestJS từ AppModule (module gốc)
  const app = await NestFactory.create(AppModule);

  // ConfigService: đọc biến môi trường đã nạp bởi ConfigModule trong AppModule
  const config = app.get(ConfigService);

  // ---- Tiền tố "/api" cho MỌI route -> vd: GET /customers thành GET /api/customers ----
  // Giúp phân biệt rõ ràng route API với các route tĩnh khác nếu sau này deploy chung server.
  app.setGlobalPrefix('api');

  // ---- ValidationPipe toàn cục: tự động validate MỌI request body theo các
  // decorator (@IsString, @IsEnum...) khai báo trong từng DTO. ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // tự động LOẠI BỎ field lạ không khai báo trong DTO (chống thừa dữ liệu độc hại)
      forbidNonWhitelisted: false, // không báo lỗi khi có field lạ, chỉ âm thầm loại bỏ (đỡ khó chịu cho client)
      transform: true, // tự động convert kiểu dữ liệu, vd: query string "5" -> number 5 (nhờ @Type/ParseIntPipe)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ---- CORS: cho phép frontend (Next.js chạy ở domain/port khác) gọi API này ----
  const corsOrigin =
    config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()), // hỗ trợ nhiều domain, cách nhau dấu phẩy trong .env
    credentials: true,
  });

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port, '0.0.0.0');

  Logger.log(
    `🚀 Server đang chạy tại: http://0.0.0.0:${port}/api`,
    'Bootstrap',
  );
}

// Gọi hàm bootstrap() để khởi động app. void ở đầu để báo hiệu rõ ràng ta
// KHÔNG cần xử lý gì thêm với Promise trả về (tránh cảnh báo linter "floating promise").
void bootstrap();
