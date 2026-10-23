// ============================================================================
// AuthService: xử lý logic đăng nhập — kiểm tra username/password, nếu đúng
// thì ký (sign) và trả về JWT access token.
// ============================================================================
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService, // provider có sẵn của @nestjs/jwt, lo việc sign/verify token
  ) {}

  async login(dto: LoginDto) {
    // 1. Tìm user theo username (kèm passwordHash, vì cần so sánh mật khẩu)
    const user = await this.usersService.findByUsernameWithPassword(
      dto.username,
    );

    // 2. Nếu không tìm thấy user -> báo lỗi chung chung "sai tài khoản/mật khẩu"
    //    (KHÔNG nói rõ "user không tồn tại" để tránh lộ thông tin cho kẻ dò username)
    if (!user) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // 3. So sánh mật khẩu client gửi lên với hash đã lưu trong DB.
    //    bcrypt.compare tự lấy salt từ trong chuỗi hash, không cần lưu salt riêng.
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
    }

    // 4. Tạo payload gọn nhẹ để nhúng vào token (KHÔNG nhét passwordHash vào đây)
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    // 5. jwtService.signAsync ký token bằng JWT_SECRET + JWT_EXPIRES_IN
    //    (cấu hình toàn cục trong AuthModule bên dưới)
    const accessToken = await this.jwtService.signAsync(payload);

    // 6. Trả về token + thông tin user cơ bản để frontend lưu và hiển thị ngay
    return {
      accessToken,
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  // ==========================================================================
  // register(): tự đăng ký tài khoản mới — CÔNG KHAI, không cần token.
  // Khác hẳn UsersService.create() (chỉ admin gọi được, cho phép chọn role tuỳ ý),
  // hàm này LUÔN LUÔN tạo tài khoản với role='staff', bất kể client gửi gì lên,
  // để không ai có thể tự đăng ký thành admin qua đường vòng này.
  // Sau khi tạo xong, tự đăng nhập luôn (trả về accessToken) cho tiện UX,
  // giống hệt hành vi bản gốc (đăng ký xong quay lại form login với username đã điền sẵn).
  // ==========================================================================
  async register(dto: RegisterDto) {
    const existed = await this.usersService.findByUsernameWithPassword(
      dto.username,
    );
    if (existed) {
      throw new ConflictException('Tên đăng nhập này đã tồn tại');
    }

    const created = await this.usersService.create({
      username: dto.username,
      password: dto.password,
      role: 'staff', // ép cứng, KHÔNG đọc role từ client
    });

    const payload = {
      userId: created.id,
      username: created.username,
      role: created.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, user: created };
  }
}
