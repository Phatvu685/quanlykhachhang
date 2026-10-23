// ============================================================================
// CreateProductDto: dữ liệu tạo mới 1 sản phẩm
// ============================================================================
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(['kg', 'bao', 'thung', 'chai'], {
    message: 'Đơn vị không hợp lệ (chỉ nhận: kg, bao, thung, chai)',
  })
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
