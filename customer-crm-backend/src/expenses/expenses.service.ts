// ============================================================================
// ExpensesService: quản lý "Sổ dòng tiền" — port lại nguyên vẹn logic
// renderCashflow() từ file gốc, gồm:
//  - CRUD khoản chi_phi/von/hoan_von nhập tay
//  - getSummary(): tính các số tổng (doanh thu, công nợ, chi phí, vốn, lời/lỗ)
//  - getLedger(): gộp cả doanh thu/công nợ (tính động từ Customer) + expenses
//    thành 1 sổ cái duy nhất, giống bảng "Dòng tiền" hiển thị trên UI gốc.
// ============================================================================
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.expense.findMany({ orderBy: { id: 'desc' } });
  }

  async findOne(id: number) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense)
      throw new NotFoundException(`Không tìm thấy khoản mục id=${id}`);
    return expense;
  }

  // ---- Tạo khoản NHẬP TAY (chi_phi / von / hoan_von) ----
  async create(dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        kind: dto.kind,
        name: dto.name,
        amount: dto.amount,
        date: dto.date,
        note: dto.note,
        autoStock: false, // khoản nhập tay luôn có autoStock = false
      },
    });
  }

  async update(id: number, dto: UpdateExpenseDto) {
    const expense = await this.findOne(id);
    // Chặn sửa các khoản do hệ thống tự sinh từ phiếu nhập kho — khớp với
    // "isExpenseEditable" phía frontend gốc (chỉ sửa qua tab Kho hàng).
    if (expense.autoStock) {
      throw new BadRequestException(
        'Khoản mục này được tự động tạo từ phiếu nhập kho, vui lòng sửa ở tab Kho hàng.',
      );
    }
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    const expense = await this.findOne(id);
    if (expense.autoStock) {
      throw new BadRequestException(
        'Khoản mục này được tự động tạo từ phiếu nhập kho, vui lòng xoá phiếu kho tương ứng.',
      );
    }
    await this.prisma.expense.delete({ where: { id } });
    return { success: true };
  }

  // ==========================================================================
  // getSummary(): các con số tổng hợp trên đầu trang "Dòng tiền"
  // ==========================================================================
  async getSummary() {
    // Doanh thu = tổng "price" của khách hàng đã có đơn (price>0) VÀ đã trả tiền
    const revenueAgg = await this.prisma.customer.aggregate({
      _sum: { price: true },
      where: { price: { gt: 0 }, paymentStatus: { not: 'chua_tra' } },
    });
    // Công nợ = tổng "price" của khách hàng có đơn nhưng CHƯA trả tiền
    const debtAgg = await this.prisma.customer.aggregate({
      _sum: { price: true },
      where: { price: { gt: 0 }, paymentStatus: 'chua_tra' },
    });
    // 3 loại khoản mục cộng dồn theo "kind"
    const expenseAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { kind: 'chi_phi' },
    });
    const capitalAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { kind: 'von' },
    });
    const refundAgg = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { kind: 'hoan_von' },
    });

    // Prisma trả về Decimal|null cho _sum -> ép hết về number, mặc định 0 nếu null
    const totalRevenue = Number(revenueAgg._sum.price) || 0;
    const totalDebt = Number(debtAgg._sum.price) || 0;
    const totalExpense = Number(expenseAgg._sum.amount) || 0;
    const totalCapital = Number(capitalAgg._sum.amount) || 0;
    const totalRefund = Number(refundAgg._sum.amount) || 0;

    return {
      totalRevenue,
      totalDebt,
      totalExpense,
      totalCapital,
      totalRefund,
      // Vốn đang treo = vốn đã góp - vốn đã hoàn lại cho thành viên
      capitalOutstanding: totalCapital - totalRefund,
      // Lời/lỗ KHÔNG trừ "hoàn vốn" vì đó chỉ là chuyển tiền nội bộ, không phải chi phí kinh doanh
      profit: totalRevenue - totalExpense - totalCapital,
    };
  }

  // ==========================================================================
  // getLedger(): sổ cái gộp — mỗi dòng gồm loại (revenue/debt/chi_phi/von/hoan_von),
  // tên, số tiền, ngày, ghi chú — sắp xếp theo ngày mới nhất lên đầu.
  // ==========================================================================
  async getLedger() {
    const paidCustomers = await this.prisma.customer.findMany({
      where: { price: { gt: 0 }, paymentStatus: { not: 'chua_tra' } },
    });
    const debtCustomers = await this.prisma.customer.findMany({
      where: { price: { gt: 0 }, paymentStatus: 'chua_tra' },
    });
    const expenses = await this.prisma.expense.findMany();

    // Chuẩn hoá 3 nguồn dữ liệu khác nhau về cùng 1 hình dạng để gộp chung 1 mảng
    const revenueEntries = paidCustomers.map((c) => ({
      id: `cust-${c.id}`,
      kind: 'revenue' as const,
      name: c.name,
      amount: Number(c.price),
      date: c.lastOrderDate || c.acquiredDate || '',
      note: Number(c.kg) ? `${Number(c.kg)} kg — đã thu` : 'đã thu',
    }));

    const debtEntries = debtCustomers.map((c) => ({
      id: `debt-${c.id}`,
      kind: 'debt' as const,
      name: c.name,
      amount: Number(c.price),
      date: c.lastOrderDate || c.acquiredDate || '',
      note: Number(c.kg) ? `${Number(c.kg)} kg — công nợ` : 'công nợ',
      custId: c.id,
    }));

    const expenseEntries = expenses.map((e) => ({
      id: `exp-${e.id}`,
      kind: e.kind,
      name: e.name,
      amount: Number(e.amount),
      date: e.date || '',
      note: e.note || '',
      autoStock: e.autoStock,
    }));

    // Gộp 3 mảng rồi sắp xếp giảm dần theo ngày (chuỗi "yyyy-mm-dd" nên so sánh
    // bằng localeCompare vẫn cho đúng thứ tự thời gian). Dòng không có ngày bị đẩy xuống cuối.
    return [...revenueEntries, ...debtEntries, ...expenseEntries].sort(
      (a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
      },
    );
  }
}
