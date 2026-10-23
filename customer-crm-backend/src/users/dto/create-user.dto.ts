// ============================================================================
// DTO (Data Transfer Object): định nghĩa hình dạng + luật kiểm tra dữ liệu
// đầu vào của request. NestJS sẽ tự động validate dựa theo các decorator của
// class-validator (nhờ ValidationPipe được bật global trong main.ts).
// ============================================================================
import { IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';
import type { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Username không được để trống' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string; // mật khẩu THÔ do client gửi lên, service sẽ tự băm (hash) trước khi lưu DB

  @IsIn(['admin', 'staff'], { message: 'role phải là admin hoặc staff' })
  role: Role;
}
