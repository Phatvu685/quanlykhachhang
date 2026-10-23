import { IsInt, IsOptional, IsPositive } from 'class-validator';

// Chuyển giao khách hàng cho nhân viên khác (hoặc bỏ trống = "Chưa phân công")
export class TransferCustomerDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  staffUserId?: number;
}
