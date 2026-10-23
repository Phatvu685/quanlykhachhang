// ============================================================================
// UsersService: chứa toàn bộ logic nghiệp vụ liên quan tới tài khoản đăng nhập.
// Controller KHÔNG được thao tác thẳng với Prisma — mọi truy vấn DB phải đi
// qua Service, đây là quy ước chuẩn của NestJS giúp code dễ test/maintain.
// ============================================================================
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt'; // thư viện băm mật khẩu 1 chiều (không thể giải mã ngược)
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SALT_ROUNDS = 10; // độ phức tạp khi băm mật khẩu, 10 là mức cân bằng tốc độ/bảo mật phổ biến

@Injectable()
export class UsersService {
  // constructor injection: Nest tự đưa PrismaService (đã tạo ở PrismaModule) vào đây
  constructor(private readonly prisma: PrismaService) {}

  // ---- Lấy danh sách toàn bộ user (KHÔNG trả passwordHash ra ngoài) ----
  async findAll() {
    // await vì thao tác DB luôn là bất đồng bộ (mạng, disk I/O...)
    return this.prisma.user.findMany({
      // select: chỉ định rõ field muốn lấy -> loại bỏ passwordHash khỏi kết quả trả về client
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { id: 'asc' }, // sắp xếp theo id tăng dần cho ổn định thứ tự hiển thị
    });
  }

  // ---- Lấy 1 user theo id, ném lỗi 404 nếu không tồn tại ----
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException(`Không tìm thấy user id=${id}`);
    return user;
  }

  // ---- Tìm theo username kèm passwordHash (dùng nội bộ cho AuthService.login) ----
  async findByUsernameWithPassword(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  // ---- Tạo user mới ----
  async create(dto: CreateUserDto) {
    // Kiểm tra trùng username trước để trả lỗi rõ ràng (409 Conflict) thay vì lỗi DB khó hiểu
    const existed = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existed) throw new ConflictException('Username đã tồn tại');

    // bcrypt.hash là hàm bất đồng bộ -> phải "await"
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const created = await this.prisma.user.create({
      data: { username: dto.username, passwordHash, role: dto.role },
      select: { id: true, username: true, role: true, createdAt: true },
    });
    return created;
  }

  // ---- Cập nhật user (đổi role và/hoặc mật khẩu) ----
  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id); // ném 404 sớm nếu id không tồn tại

    // Xây object data động: chỉ đưa field nào thực sự được gửi lên
    const data: { username?: string; role?: any; passwordHash?: string } = {};
    if (dto.username) data.username = dto.username;
    if (dto.role) data.role = dto.role;
    if (dto.password)
      data.passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, createdAt: true },
    });
  }

  // ---- Xoá user ----
  async remove(id: number) {
    await this.findOne(id);
    // onDelete: SetNull trên Customer.staffUserId (khai báo trong schema.prisma)
    // đảm bảo xoá user không làm vỡ dữ liệu khách hàng đang gán cho user đó.
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
