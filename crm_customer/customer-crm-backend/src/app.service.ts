import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'Customer CRM API',
      description: 'Backend NestJS cho app Quản Lý Khách Hàng — Vị Nguyên Food',
      docs: 'Xem README.md để biết danh sách endpoint đầy đủ',
    };
  }
}
