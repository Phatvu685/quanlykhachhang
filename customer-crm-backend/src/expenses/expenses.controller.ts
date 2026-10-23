import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // GET /expenses -> danh sách khoản mục nhập tay (chi_phi/von/hoan_von)
  @Get()
  async findAll() {
    return this.expensesService.findAll();
  }

  // GET /expenses/summary -> các số tổng hợp (doanh thu, công nợ, lời/lỗ...)
  @Get('summary')
  async getSummary() {
    return this.expensesService.getSummary();
  }

  // GET /expenses/ledger -> sổ cái gộp đầy đủ (doanh thu + công nợ + chi phí/vốn)
  @Get('ledger')
  async getLedger() {
    return this.expensesService.getLedger();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.expensesService.findOne(id);
  }

  @Post()
  @Roles('admin') // chỉ admin được ghi nhận vốn/chi phí (dữ liệu tài chính nhạy cảm)
  async create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.expensesService.remove(id);
  }
}
