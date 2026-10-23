// ============================================================================
// CreateComboDto
// ============================================================================
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import type { OfferType } from '@prisma/client';

export class CreateComboDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên combo không được để trống' })
  name: string;

  @IsOptional()
  @IsString()
  desc?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  productId?: number; // id sản phẩm chính trong bảng products

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  baseKg: number; // số lượng gốc của combo

  @IsNumber()
  @Min(0)
  unitPrice: number; // đơn giá / đơn vị

  @IsIn(['percent', 'money', 'kg'], {
    message: 'offerType phải là percent | money | kg',
  })
  offerType: OfferType;

  @IsNumber()
  @Min(0)
  offerValue: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  giftProductId?: number; // sản phẩm tặng kèm (nếu có)

  @IsOptional()
  @IsNumber()
  @Min(0)
  giftQty?: number;
}
