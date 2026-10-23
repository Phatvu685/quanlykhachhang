import { Module } from '@nestjs/common';
import { StockEntriesService } from './stock-entries.service';
import { StockEntriesController } from './stock-entries.controller';

@Module({
  controllers: [StockEntriesController],
  providers: [StockEntriesService],
  exports: [StockEntriesService], // CustomersModule sẽ dùng lại khi đồng bộ xuất kho cho khách hàng
})
export class StockEntriesModule {}
