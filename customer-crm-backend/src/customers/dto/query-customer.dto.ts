// ============================================================================
// QueryCustomerDto: các query param cho phép lọc danh sách khách hàng,
// port lại từ bộ lọc trong renderCustomerList()/renderOrders() bản gốc.
// ============================================================================
import { IsIn, IsOptional, IsString } from 'class-validator';
import type {
  CustomerStage,
  CustomerType,
  PaymentStatus,
} from '@prisma/client';

export class QueryCustomerDto {
  @IsOptional()
  @IsIn(['order', 'cskh'])
  stage?: CustomerStage; // lọc theo tab: 'order' hoặc 'cskh'

  @IsOptional()
  @IsString()
  search?: string; // tìm theo tên hoặc số điện thoại

  @IsOptional()
  @IsIn(['moi', 'cu', 'tiemnang'])
  type?: CustomerType;

  @IsOptional()
  @IsString()
  staffUserId?: string; // truyền "none" để lọc khách CHƯA phân công, hoặc id dạng chuỗi số

  @IsOptional()
  @IsIn(['da_tra', 'chua_tra'])
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsIn(['da', 'chua'])
  packed?: 'da' | 'chua';

  @IsOptional()
  @IsIn(['da', 'chua'])
  delivered?: 'da' | 'chua';

  @IsOptional()
  @IsString()
  fromDate?: string; // dùng cho tab Đơn hàng: lọc theo khoảng ngày

  @IsOptional()
  @IsString()
  toDate?: string;

  // Chỉ lấy khách đã có giá trị đơn (price > 0) — dùng cho tab "Đơn hàng"
  @IsOptional()
  @IsIn(['true', 'false'])
  onlyOrders?: 'true' | 'false';
}
