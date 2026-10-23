// ============================================================================
// JwtAuthGuard: guard bắt buộc request phải có JWT hợp lệ ở header
// "Authorization: Bearer <token>" thì mới cho đi tiếp vào controller.
// Chỉ cần "extends AuthGuard('jwt')" là đủ — Passport lo phần giải mã/verify token,
// dựa theo cấu hình khai báo trong JwtStrategy (auth/strategies/jwt.strategy.ts).
// ============================================================================
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
