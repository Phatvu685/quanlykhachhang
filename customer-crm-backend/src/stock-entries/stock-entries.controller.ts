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
import { StockEntriesService } from './stock-entries.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { UpdateStockEntryDto } from './dto/update-stock-entry.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('stock-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockEntriesController {
  constructor(private readonly stockEntriesService: StockEntriesService) {}

  @Get()
  async findAll() {
    return this.stockEntriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stockEntriesService.findOne(id);
  }

  @Post()
  @Roles('admin') // chỉ admin quản lý kho (nhập/xuất ảnh hưởng trực tiếp tới sổ dòng tiền)
  async create(@Body() dto: CreateStockEntryDto) {
    return this.stockEntriesService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStockEntryDto,
  ) {
    return this.stockEntriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.stockEntriesService.remove(id);
  }
}
