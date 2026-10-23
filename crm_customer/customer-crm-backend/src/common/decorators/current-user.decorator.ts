// ============================================================================
// @CurrentUser(): custom param decorator, giúp lấy thông tin user đang đăng
// nhập (đã được JwtStrategy gắn vào req.user) ngay trong tham số của controller,
// thay vì phải viết "@Req() req" rồi tự lấy "req.user" ở mọi nơi.
// Ví dụ dùng: getMe(@CurrentUser() user: AuthUser) {}
// ============================================================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Kiểu dữ liệu user đính kèm trong token JWT sau khi giải mã (payload rút gọn,
// KHÔNG chứa passwordHash để tránh lộ dữ liệu nhạy cảm ra ngoài request).
export interface AuthUser {
  userId: number;
  username: string;
  role: 'admin' | 'staff';
}

interface RequestWithUser {
  user?: AuthUser;
}

export const CurrentUser = createParamDecorator(
  // data: tham số truyền vào decorator (không dùng ở đây), ctx: ngữ cảnh request hiện tại
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    // Chuyển ExecutionContext (chung cho cả HTTP/WS/RPC) về đúng kiểu HTTP request
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    return user;
  },
);
