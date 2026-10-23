// ============================================================================
// CreateExpenseDto — dùng cho các khoản NHẬP TAY: chi_phi thường, von, hoan_von.
// (Khoản chi_phi tự sinh từ phiếu nhập kho được tạo qua StockEntriesService,
//  không đi qua endpoint này — xem thêm expenses.controller.ts)
// ============================================================================
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { ExpenseKind } from '@prisma/client';

export class CreateExpenseDto {
  @IsIn(['chi_phi', 'von', 'hoan_von'], {
    message: 'kind phải là chi_phi | von | hoan_von',
  })
  kind: ExpenseKind;

  @IsString()
  @IsNotEmpty({ message: 'Tên khoản mục không được để trống' })
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
