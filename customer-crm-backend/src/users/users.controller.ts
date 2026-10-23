// ============================================================================
// UsersController: định nghĩa các route HTTP (REST) cho tài nguyên "users".
// Mặc định (class-level) mọi route yêu cầu đã đăng nhập VÀ phải là admin —
// NGOẠI TRỪ route "directory" bên dưới, cố tình mở cho MỌI người đã đăng nhập
// (kể cả staff), vì nó chỉ trả về id+username (không có gì nhạy cảm) và được
// dùng để hiển thị đúng tên nhân viên phụ trách trên khắp giao diện.
// ============================================================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe, // tự động convert + validate param dạng số (vd: "/users/5" -> 5, "/users/abc" -> lỗi 400)
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users') // toàn bộ route trong class này có tiền tố "/users"
@UseGuards(JwtAuthGuard, RolesGuard) // áp dụng 2 guard cho MỌI route bên dưới
@Roles('admin') // mặc định chỉ admin — route "directory" bên dưới tự override lại
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/directory -> {id, username} cho MỌI tài khoản đã đăng nhập (không chỉ admin).
  // KHÔNG trả role/createdAt/passwordHash — chỉ đủ dữ liệu để frontend map "username -> id"
  // và hiển thị đúng tên nhân viên phụ trách, kể cả với tài khoản vừa tự đăng ký.
  // Đặt route này TRƯỚC ":id" để không bị nuốt bởi route động phía dưới.
  @Get('directory')
  @Roles('admin', 'staff') // override lại @Roles('admin') ở class-level — cho phép cả 2 role
  async directory() {
    const all = await this.usersService.findAll();
    return all.map((u) => ({ id: u.id, username: u.username }));
  }

  @Get() // GET /users
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id') // GET /users/:id
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post() // POST /users
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id') // PATCH /users/:id
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id') // DELETE /users/:id
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
