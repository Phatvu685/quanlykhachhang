// ============================================================================
// AuthController: 2 route công khai (không cần token) là POST /auth/login,
// và 1 route GET /auth/me để frontend tự kiểm tra token còn hiệu lực không
// + lấy lại thông tin user (dùng khi F5 lại trang, giữ trạng thái đăng nhập).
// ============================================================================
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK) // mặc định NestJS trả 201 cho @Post, ta ép về 200 cho đúng ngữ nghĩa "login"
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Công khai — ai cũng gọi được, KHÔNG cần đăng nhập trước.
  // Luôn tạo tài khoản role='staff' (xem AuthService.register).
  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard) // route này BẮT BUỘC phải có token hợp lệ mới gọi được
  me(@CurrentUser() user: AuthUser) {
    return user; // trả lại chính payload đã giải mã từ token (id, username, role)
  }
}
