import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// PartialType: mọi field của CreateProductDto trở thành optional khi update
export class UpdateProductDto extends PartialType(CreateProductDto) {}
