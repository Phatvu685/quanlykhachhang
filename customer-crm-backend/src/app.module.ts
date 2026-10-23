// ============================================================================
// AppModule: module GỐC của toàn bộ ứng dụng — nơi "lắp ráp" tất cả module con
// lại với nhau. NestJS khởi động bằng cách đọc module này (xem main.ts).
// ============================================================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CombosModule } from './combos/combos.module';
import { CustomersModule } from './customers/customers.module';
import { StockEntriesModule } from './stock-entries/stock-entries.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SocialAccountsModule } from './social-accounts/social-accounts.module';
import { DataImportModule } from './data-import/data-import.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ isGlobal: true }): đọc file .env MỘT LẦN DUY NHẤT
    // lúc khởi động, rồi cho phép mọi module khác inject ConfigService để đọc
    // biến môi trường (thay vì mỗi nơi tự gọi process.env.XXX rải rác).
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule, // kết nối DB (Global, các module dưới không cần import lại)
    AuthModule, // đăng nhập / JWT
    UsersModule, // quản lý tài khoản đăng nhập
    ProductsModule, // sản phẩm kho
    CombosModule, // combo khuyến mãi
    CustomersModule, // khách hàng / đơn hàng / CSKH (module lõi)
    StockEntriesModule, // phiếu nhập/xuất kho
    ExpensesModule, // sổ dòng tiền
    SocialAccountsModule, // tài khoản MXH chăm sóc khách hàng
    DataImportModule, // nhập & xuất dữ liệu JSON
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
