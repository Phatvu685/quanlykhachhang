// ============================================================================
// StockEntriesService: quản lý phiếu nhập/xuất kho.
//
// LOGIC QUAN TRỌNG (port lại 1:1 từ syncStockExpense() trong file gốc):
// Mỗi khi 1 phiếu NHẬP kho (type='nhap') có unitPrice > 0 được tạo/sửa,
// hệ thống TỰ ĐỘNG tạo/cập nhật 1 khoản "Chi phí bán hàng" (Expense, kind='chi_phi',
// autoStock=true) tương ứng bên Sổ dòng tiền. Nếu phiếu bị xoá giá trị hoặc đổi
// sang "xuat", khoản chi phí tự sinh đó cũng bị xoá theo.
// Toàn bộ thao tác ghi (create/update/delete) đều được bọc trong
// prisma.$transaction để đảm bảo StockEntry và Expense luôn đồng bộ — không
// bao giờ có tình trạng tạo được phiếu kho nhưng lỡ tạo Expense.
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockEntry } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';
import { UpdateStockEntryDto } from './dto/update-stock-entry.dto';

@Injectable()
export class StockEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.stockEntry.findMany({
      include: { product: true, expense: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const entry = await this.prisma.stockEntry.findUnique({
      where: { id },
      include: { product: true, expense: true },
    });
    if (!entry)
      throw new NotFoundException(`Không tìm thấy phiếu kho id=${id}`);
    return entry;
  }

  // ---- Tạo phiếu kho mới ----
  async create(dto: CreateStockEntryDto) {
    // $transaction(async (tx) => {...}): tx là 1 "phiên bản" PrismaClient dùng
    // trong 1 giao dịch DB. Nếu bất kỳ câu lệnh nào trong callback ném lỗi,
    // TOÀN BỘ các thay đổi (cả StockEntry lẫn Expense) sẽ tự động rollback.
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.stockEntry.create({
        data: {
          type: dto.type,
          productId: dto.productId,
          qty: dto.qty,
          unitPrice: dto.unitPrice ?? 0,
          supplier: dto.supplier,
          date: dto.date,
          note: dto.note,
        },
        include: { product: true },
      });

      await this.syncStockExpense(tx, entry);

      // Đọc lại entry kèm quan hệ "expense" mới nhất sau khi đã đồng bộ xong
      return tx.stockEntry.findUniqueOrThrow({
        where: { id: entry.id },
        include: { product: true, expense: true },
      });
    });
  }

  // ---- Cập nhật phiếu kho ----
  async update(id: number, dto: UpdateStockEntryDto) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.stockEntry.update({
        where: { id },
        data: dto,
        include: { product: true },
      });
      await this.syncStockExpense(tx, entry);
      return tx.stockEntry.findUniqueOrThrow({
        where: { id: entry.id },
        include: { product: true, expense: true },
      });
    });
  }

  // ---- Xoá phiếu kho ----
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      // Xoá khoản Expense tự sinh (nếu có) TRƯỚC, vì nó tham chiếu ngược tới stockEntryId
      await tx.expense.deleteMany({ where: { stockEntryId: id } });
      await tx.stockEntry.delete({ where: { id } });
      return { success: true };
    });
  }

  // ==========================================================================
  // syncStockExpense: PORT 1:1 từ hàm cùng tên trong script.js gốc.
  // "tx" là Prisma transaction client (được truyền vào từ create/update ở trên)
  // để đảm bảo mọi câu lệnh chạy chung 1 giao dịch DB.
  // ==========================================================================
  private async syncStockExpense(
    tx: Prisma.TransactionClient,
    entry: StockEntry & { product?: { name: string } },
  ) {
    const unitPrice = Number(entry.unitPrice) || 0;
    // Chỉ sinh chi phí khi là phiếu NHẬP và có giá trị (>0), giống hệt điều kiện gốc
    const shouldHaveExpense = entry.type === 'nhap' && unitPrice > 0;

    // Tìm khoản Expense đã gắn với phiếu kho này (nếu có, quan hệ 1-1 qua stockEntryId)
    const existingExpense = await tx.expense.findUnique({
      where: { stockEntryId: entry.id },
    });

    if (shouldHaveExpense) {
      const productName = entry.product?.name ?? 'Sản phẩm';
      const name = `Nhập hàng: ${productName}`;

      // Ghép ghi chú giống hệt cách nối chuỗi ở bản gốc: "Tự động từ phiếu kho #id - NCC: ... - ghi chú"
      const noteParts = [`Tự động từ phiếu kho #${entry.id}`];
      if (entry.supplier) noteParts.push(`NCC: ${entry.supplier}`);
      if (entry.note) noteParts.push(entry.note);
      const note = noteParts.join(' - ');

      if (existingExpense) {
        // Đã có Expense tự sinh trước đó -> cập nhật lại cho khớp phiếu kho mới nhất
        await tx.expense.update({
          where: { id: existingExpense.id },
          data: {
            kind: 'chi_phi',
            name,
            amount: unitPrice,
            date: entry.date,
            note,
            autoStock: true,
          },
        });
      } else {
        // Chưa có -> tạo mới, đồng thời gắn stockEntryId để lần sau tìm lại được
        await tx.expense.create({
          data: {
            kind: 'chi_phi',
            name,
            amount: unitPrice,
            date: entry.date,
            note,
            autoStock: true,
            stockEntryId: entry.id,
          },
        });
      }
    } else if (existingExpense) {
      // Phiếu kho không còn đủ điều kiện có chi phí (đổi thành "xuat" hoặc unitPrice=0)
      // -> xoá khoản Expense đã tự sinh trước đó, giữ dữ liệu luôn nhất quán.
      await tx.expense.delete({ where: { id: existingExpense.id } });
    }
  }
}
