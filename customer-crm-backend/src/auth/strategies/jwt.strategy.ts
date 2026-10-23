// ============================================================================
// JwtStrategy: khai báo CÁCH Passport lấy + giải mã JWT token từ request.
// Đây là "cấu hình" mà JwtAuthGuard (extends AuthGuard('jwt')) sẽ dùng ngầm.
// ============================================================================
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
// PassportStrategy(Strategy, 'jwt'): đăng ký chiến lược tên là "jwt"
// (khớp với chuỗi 'jwt' truyền vào AuthGuard('jwt') ở jwt-auth.guard.ts)
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      // Chỉ định lấy token từ header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // false: KHÔNG bỏ qua việc kiểm tra hạn token -> token hết hạn sẽ bị từ chối
      ignoreExpiration: false,
      // Khoá bí mật để verify chữ ký token, lấy từ biến môi trường JWT_SECRET
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  // validate() được Passport tự gọi SAU KHI verify chữ ký + hạn token thành công.
  // Giá trị "payload" chính là object đã đưa vào lúc ký token (AuthService.login).
  // Giá trị return của hàm này sẽ được gán vào "request.user".
  validate(payload: AuthUser): AuthUser {
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  }
}
