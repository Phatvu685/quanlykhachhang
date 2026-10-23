// ============================================================================
// RegisterDto: dữ liệu tự đăng ký tài khoản NHÂN VIÊN mới (public, không cần
// đăng nhập trước). Không có field "role" — role luôn bị ép cứng là "staff"
// ở AuthService.register(), tự đăng ký KHÔNG BAO GIỜ tạo được tài khoản admin.
// ============================================================================
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập username' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;
}
