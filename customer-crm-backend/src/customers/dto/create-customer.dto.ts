// ============================================================================
// CreateCustomerDto — dữ liệu tạo mới 1 khách hàng / đơn hàng.
// Lưu ý: giftProductId/giftQty KHÔNG nằm trong DTO này vì chúng được suy ra
// tự động từ combo (comboId) ở tầng service, giống hệt cách applyComboToCustomerForm()
// tự tính ở bản gốc — client chỉ cần gửi comboId, backend tự lo phần còn lại.
// ============================================================================
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import type {
  CustomerStage,
  CustomerType,
  PaymentStatus,
} from '@prisma/client';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên khách hàng' })
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsIn(['moi', 'cu', 'tiemnang'], {
    message: 'type phải là moi | cu | tiemnang',
  })
  type: CustomerType;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  kg?: number;

  // Lưu ý: giống bản gốc, giá trị này lưu ĐƠN VỊ ĐỒNG (VNĐ) đầy đủ, KHÔNG phải nghìn đồng.
  // Việc nhân 1000 (do form nhập theo đơn vị "nghìn đồng") là trách nhiệm của FRONTEND trước khi gửi lên.
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  comboId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  staffUserId?: number; // id nhân viên phụ trách (tham chiếu bảng User)

  // Sản phẩm chính khách mua — backend sẽ tự tạo/cập nhật phiếu xuất kho tương ứng
  @IsOptional()
  @IsInt()
  @IsPositive()
  productId?: number;

  @IsOptional()
  @IsIn(['order', 'cskh'], { message: 'stage phải là order | cskh' })
  stage?: CustomerStage;

  @IsOptional()
  @IsIn(['da_tra', 'chua_tra'], {
    message: 'paymentStatus phải là da_tra | chua_tra',
  })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsBoolean()
  packed?: boolean;

  @IsOptional()
  @IsBoolean()
  delivered?: boolean;

  @IsOptional()
  @IsString()
  acquiredDate?: string;

  @IsOptional()
  @IsString()
  lastOrderDate?: string;

  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  nextContactDate?: string;
}
