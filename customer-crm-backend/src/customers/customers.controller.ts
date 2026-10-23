// ============================================================================
// CustomersController: toàn bộ route REST cho tài nguyên "customers".
// Mọi nhân viên (staff) đều xem/tạo/sửa được khách hàng — nhưng CHỈ với khách
// hàng do CHÍNH họ phụ trách (enforce ở CustomersService, không tin client).
// Route "/transfer" là ngoại lệ — CHỈ ADMIN mới gọi được (@Roles('admin')).
// ============================================================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { TransferCustomerDto } from './dto/transfer-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard) // chỉ cần đăng nhập, không giới hạn role cụ thể (trừ route transfer bên dưới)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // GET /customers?stage=order&search=...&type=...&staffUserId=...&onlyOrders=true...
  @Get()
  async findAll(
    @Query() query: QueryCustomerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.findAll(query, user);
  }

  // GET /customers/stats -> {total, cskh, old, lead} — port renderStats()
  @Get('stats')
  async getStats(@CurrentUser() user: AuthUser) {
    return this.customersService.getStats(user);
  }

  // GET /customers/today-order-count -> port orderTodayCount trong renderOrders()
  @Get('today-order-count')
  async getTodayOrderCount(@CurrentUser() user: AuthUser) {
    return { count: await this.customersService.getTodayOrderCount(user) };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.findOne(id, user);
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    return this.customersService.create(dto, user);
  }

  // POST /customers/:id/repeat -> "Mua lại": tạo đơn hàng mới, giữ nguyên thông tin khách
  @Post(':id/repeat')
  async repeat(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.repeatOrder(id, user);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.update(id, dto, user);
  }

  // ---- Các route toggle 1-click, khớp với nút "🔄 Đổi" trên UI gốc ----
  @Patch(':id/toggle-payment')
  async togglePayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.togglePaymentStatus(id, user);
  }

  @Patch(':id/toggle-packed')
  async togglePacked(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.togglePacked(id, user);
  }

  @Patch(':id/toggle-delivered')
  async toggleDelivered(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.toggleDelivered(id, user);
  }

  @Patch(':id/toggle-stage')
  async toggleStage(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.toggleStage(id, user);
  }

  // CHỈ ADMIN — thêm RolesGuard + @Roles('admin') riêng cho route này (class-level
  // chỉ có JwtAuthGuard, nên phải khai báo cả 2 guard tại đây mới áp dụng kiểm tra role).
  @Patch(':id/transfer')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferCustomerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.transfer(id, dto, user);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customersService.remove(id, user);
  }
}
