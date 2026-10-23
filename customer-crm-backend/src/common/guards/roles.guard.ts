// ============================================================================
// RolesGuard: chạy SAU JwtAuthGuard (nên luôn khai báo thứ tự
// @UseGuards(JwtAuthGuard, RolesGuard) ). Kiểm tra role của user hiện tại
// (đã được gắn vào req.user) có nằm trong danh sách @Roles(...) yêu cầu không.
// ============================================================================
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Role } from '@prisma/client';
import type { AuthUser } from '../decorators/current-user.decorator';

interface RequestWithUser {
  user?: AuthUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector được NestJS tự inject qua constructor (Dependency Injection)
  constructor(private readonly reflector: Reflector) {}

  // canActivate: trả về true -> cho phép request đi tiếp; false/throw -> chặn lại
  canActivate(context: ExecutionContext): boolean {
    // Đọc danh sách role yêu cầu, ưu tiên lấy ở method handler, nếu không có thì lấy ở class (controller)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(), // vd: hàm createProduct()
      context.getClass(), // vd: class ProductsController
    ]);

    // Nếu endpoint không gắn @Roles(...) nào -> không giới hạn role, ai đăng nhập cũng gọi được
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Lấy user hiện tại (đã được JwtAuthGuard xác thực và gắn vào request trước đó)
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // So khớp role của user với danh sách role được phép
    const allowed = !!user && requiredRoles.includes(user.role);
    if (!allowed) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện thao tác này.',
      );
    }
    return true;
  }
}
