// ============================================================================
// @Roles(...): custom decorator để gắn "metadata" liệt kê role nào được phép
// gọi 1 endpoint. Dùng chung với RolesGuard bên dưới để kiểm tra quyền.
// Ví dụ dùng:  @Roles('admin')  @Post()  createProduct(...) {}
// ============================================================================
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // enum Role ('admin' | 'staff') do Prisma tự sinh từ schema.prisma

export const ROLES_KEY = 'roles'; // key dùng để lưu/đọc metadata, tránh gõ nhầm chuỗi ở nhiều nơi

// "...roles: Role[]" cho phép truyền nhiều role: @Roles('admin', 'staff')
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
