import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import type { StockType } from '@prisma/client';

export class CreateStockEntryDto {
  @IsIn(['nhap', 'xuat'], { message: 'type phải là nhap hoặc xuat' })
  type: StockType;

  @IsInt()
  @IsPositive()
  productId: number;

  @IsNumber()
  @Min(0)
  qty: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
