// ============================================================================
// UpdateUserDto: kế thừa CreateUserDto nhưng cho phép TẤT CẢ field là optional
// (PartialType tự động biến mọi @IsXxx() thành "chỉ kiểm tra khi có giá trị").
// ============================================================================
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
