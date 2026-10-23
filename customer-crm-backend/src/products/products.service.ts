// ============================================================================
// ProductsService: CRUD sản phẩm + hàm tính tồn kho hiện tại (dùng cho cảnh báo
// sắp hết hàng, port lại từ renderWarehouse() ở bản gốc: tồn = tổng nhập - tổng xuất).
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // include: stockEntries -> để tính tồn kho ngay khi trả về danh sách,
    // tránh phải gọi thêm request riêng ở frontend.
    const products = await this.prisma.product.findMany({
      include: { stockEntries: true },
      orderBy: { id: 'asc' },
    });

    // map từng sản phẩm -> tính thêm field "currentStock" (không lưu trong DB,
    // chỉ tính động mỗi lần query, giống hệt cách renderWarehouse() gốc làm trên client)
    return products.map((p) => ({
      ...p,
      stockEntries: undefined, // bỏ mảng chi tiết ra khỏi response cho gọn, chỉ giữ số tổng
      currentStock: this.calcCurrentStock(p.stockEntries),
    }));
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { stockEntries: true },
    });
    if (!product)
      throw new NotFoundException(`Không tìm thấy sản phẩm id=${id}`);
    return {
      ...product,
      currentStock: this.calcCurrentStock(product.stockEntries),
    };
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        unit: dto.unit ?? 'kg',
        minStock: dto.minStock ?? 0,
        sellPrice: dto.sellPrice ?? 0,
        note: dto.note,
      },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id); // đảm bảo tồn tại, ném 404 nếu không
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  // ==========================================================================
  // remove(): xoá sản phẩm — PORT lại đúng hành vi cascade của deleteProduct() gốc:
  // xoá luôn mọi phiếu kho + khoản chi phí tự sinh liên quan tới sản phẩm này;
  // combo/khách hàng đang tham chiếu sản phẩm này chỉ bị GỠ LIÊN KẾT (SetNull),
  // không bị xoá — khớp đúng thông báo cảnh báo đã hiển thị ở bản gốc trước khi xoá.
  // Bọc trong $transaction để đảm bảo tất cả cùng thành công hoặc cùng rollback.
  // ==========================================================================
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      // 1. Xoá các khoản chi phí tự sinh (autoStock) gắn với phiếu kho của sản phẩm này
      await tx.expense.deleteMany({
        where: { stockEntry: { productId: id } },
      });
      // 2. Xoá toàn bộ phiếu nhập/xuất kho của sản phẩm này
      //    (Customer.stockEntryId/giftStockEntryId tự SetNull nhờ onDelete: SetNull trong schema)
      await tx.stockEntry.deleteMany({ where: { productId: id } });
      // 3. Combo đang dùng sản phẩm này làm SP chính/quà tặng tự SetNull nhờ schema,
      //    Customer.productId/giftProductId cũng tự SetNull — không cần xử lý thủ công.
      // 4. Cuối cùng xoá sản phẩm
      await tx.product.delete({ where: { id } });
      return { success: true };
    });
  }

  // ---- Hàm thuần (pure function), không đụng DB, chỉ cộng trừ số ----
  // stock nhập (+qty) trừ đi stock xuất (-qty) = tồn kho hiện tại
  private calcCurrentStock(entries: { type: string; qty: any }[]): number {
    return entries.reduce((sum, e) => {
      const qty = Number(e.qty) || 0;
      return e.type === 'nhap' ? sum + qty : sum - qty;
    }, 0);
  }
}
