import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // để StockEntriesService/CustomersService dùng lại khi cần kiểm tra sản phẩm
})
export class ProductsModule {}
