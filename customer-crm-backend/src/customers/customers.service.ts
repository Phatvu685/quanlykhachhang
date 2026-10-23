// ============================================================================
// CustomersService: module lõi của toàn bộ app — quản lý khách hàng, trong đó
// 1 "khách hàng" cũng đồng thời là 1 "đơn hàng" (tab Đơn hàng chỉ là view lọc
// price > 0 trên CÙNG 1 bảng), y hệt thiết kế dữ liệu ở bản gốc.
//
// 2 hàm quan trọng nhất — syncMainStockEntry() và syncGiftStockEntry() — được
// PORT 1:1 từ syncCustomerStockEntry()/syncCustomerGiftStockEntry() gốc:
// mỗi khi khách hàng được gán 1 sản phẩm (productId) + số lượng (kg), hệ thống
// tự tạo/cập nhật/xoá 1 phiếu XUẤT KHO (StockEntry, type='xuat') tương ứng.
// Tương tự với sản phẩm quà tặng kèm combo (giftProductId/giftQty của Combo).
// ============================================================================
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Customer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { TransferCustomerDto } from './dto/transfer-customer.dto';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // DANH SÁCH + BỘ LỌC — port từ renderCustomerList()/renderOrders()
  // ==========================================================================
  async findAll(query: QueryCustomerDto, user: AuthUser) {
    // Xây object "where" động cho Prisma dựa theo các query param được gửi lên.
    // Chỉ thêm điều kiện nào THỰC SỰ có giá trị -> field không truyền = không lọc.
    const where: Prisma.CustomerWhereInput = {};

    if (query.stage) where.stage = query.stage;
    if (query.type) where.type = query.type;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

    if (user.role !== 'admin') {
      // BẢO MẬT: nhân viên (staff) CHỈ được thấy khách hàng của chính mình —
      // ép cứng điều kiện này ở tầng SERVER, bỏ qua hoàn toàn staffUserId mà
      // client gửi lên (dù frontend đã tự giới hạn, không được tin tưởng client).
      where.staffUserId = user.userId;
    } else if (query.staffUserId === 'none') {
      where.staffUserId = null; // lọc khách CHƯA phân công nhân viên nào
    } else if (query.staffUserId) {
      where.staffUserId = Number(query.staffUserId);
    }

    if (query.packed) where.packed = query.packed === 'da';
    if (query.delivered) where.delivered = query.delivered === 'da';

    // onlyOrders=true -> chỉ lấy khách đã phát sinh giá trị đơn (dùng cho tab "Đơn hàng")
    if (query.onlyOrders === 'true') where.price = { gt: 0 };

    // Tìm theo tên HOẶC số điện thoại, không phân biệt hoa/thường
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    // Lọc theo khoảng ngày (dùng cột "ngày thực" ưu tiên lastOrderDate rồi tới acquiredDate,
    // ở đây ta lọc gộp cả 2 cột bằng OR trong khoảng from-to để gần đúng nhất với bản gốc
    // vì Postgres không tính được biểu thức COALESCE ngay trong Prisma "where" một cách tiện lợi).
    if (query.fromDate || query.toDate) {
      const dateRange: Prisma.StringFilter = {};
      if (query.fromDate) dateRange.gte = query.fromDate;
      if (query.toDate) dateRange.lte = query.toDate;
      where.OR = [
        ...(where.OR ?? []),
        { lastOrderDate: dateRange },
        { AND: [{ lastOrderDate: null }, { acquiredDate: dateRange }] },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        combo: true,
        staffUser: { select: { id: true, username: true, role: true } },
        product: true,
        giftProduct: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- Kiểm tra quyền sở hữu: staff chỉ thao tác được khách hàng của CHÍNH mình ----
  private assertOwnership(
    customer: { staffUserId: number | null },
    user: AuthUser,
  ) {
    if (user.role === 'admin') return; // admin luôn được phép
    if (customer.staffUserId !== user.userId) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên khách hàng này (không phải người phụ trách).',
      );
    }
  }

  // ---- Đọc khách hàng RAW, KHÔNG kiểm tra quyền — chỉ dùng nội bộ khi đã tự kiểm tra quyền riêng ----
  private async findRaw(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        combo: true,
        staffUser: true,
        product: true,
        giftProduct: true,
      },
    });
    if (!customer)
      throw new NotFoundException(`Không tìm thấy khách hàng id=${id}`);
    return customer;
  }

  async findOne(id: number, user: AuthUser) {
    const customer = await this.findRaw(id);
    this.assertOwnership(customer, user);
    return customer;
  }

  // ==========================================================================
  // TẠO KHÁCH HÀNG MỚI — port từ addCustomer() + phần xử lý trong sự kiện
  // click "addCustomerBtn" (nhánh else, khi chưa có editingCustomerId)
  // ==========================================================================
  async create(dto: CreateCustomerDto, user: AuthUser) {
    // BẢO MẬT: nhân viên thường KHÔNG được tự gán khách hàng mới cho người khác —
    // ép staffUserId = chính họ, bỏ qua giá trị dto.staffUserId gửi lên (chỉ admin mới
    // được quyền gán cho bất kỳ ai, kể cả để trống/"Chưa phân công").
    const staffUserId =
      user.role === 'admin' ? (dto.staffUserId ?? null) : user.userId;

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name: dto.name,
          phone: dto.phone ?? '',
          address: dto.address ?? '',
          type: dto.type,
          note: dto.note ?? '',
          kg: dto.kg ?? 0,
          price: dto.price ?? 0,
          comboId: dto.comboId,
          staffUserId,
          stage: dto.stage ?? 'order',
          paymentStatus: dto.paymentStatus ?? 'da_tra',
          packed: dto.packed ?? false,
          delivered: dto.delivered ?? false,
          acquiredDate: dto.acquiredDate,
          lastOrderDate: dto.lastOrderDate,
          deliveryDate: dto.deliveryDate,
          nextContactDate: dto.nextContactDate,
        },
      });

      // Ngày dùng để ghi vào phiếu kho: ưu tiên "ngày tiếp cận", fallback "ngày đặt đơn"
      const stockDate = dto.acquiredDate || dto.lastOrderDate;

      await this.syncMainStockEntry(
        tx,
        customer,
        dto.productId ?? null,
        dto.kg ?? 0,
        stockDate,
      );
      await this.syncGiftStockEntryFromCombo(
        tx,
        customer,
        dto.comboId ?? null,
        stockDate,
      );

      return this.reloadCustomer(tx, customer.id);
    });
  }

  // ==========================================================================
  // CẬP NHẬT KHÁCH HÀNG — port từ nhánh "if(editingCustomerId)" của cùng handler trên
  // ==========================================================================
  async update(id: number, dto: UpdateCustomerDto, user: AuthUser) {
    const existing = await this.findRaw(id); // ném 404 sớm nếu không tồn tại
    this.assertOwnership(existing, user); // ném 403 nếu staff không phải người phụ trách

    // BẢO MẬT: staff không được tự đổi staffUserId (tức tự chuyển khách cho người khác
    // hoặc tự "thả tự do" khỏi mình) — chỉ admin mới dùng field này khi update trực tiếp,
    // nhân viên thường phải dùng route riêng /transfer (cũng chỉ admin gọi được).
    const staffUserId = user.role === 'admin' ? dto.staffUserId : undefined;

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.note !== undefined && { note: dto.note }),
          ...(dto.kg !== undefined && { kg: dto.kg }),
          ...(dto.price !== undefined && { price: dto.price }),
          ...(dto.comboId !== undefined && { comboId: dto.comboId }),
          ...(staffUserId !== undefined && { staffUserId }),
          ...(dto.stage !== undefined && { stage: dto.stage }),
          ...(dto.paymentStatus !== undefined && {
            paymentStatus: dto.paymentStatus,
          }),
          ...(dto.acquiredDate !== undefined && {
            acquiredDate: dto.acquiredDate,
          }),
          ...(dto.lastOrderDate !== undefined && {
            lastOrderDate: dto.lastOrderDate,
          }),
          ...(dto.deliveryDate !== undefined && {
            deliveryDate: dto.deliveryDate,
          }),
          ...(dto.nextContactDate !== undefined && {
            nextContactDate: dto.nextContactDate,
          }),
        },
      });

      // Chỉ đồng bộ lại phiếu kho nếu client có gửi productId/kg trong request này —
      // tránh vô tình xoá phiếu kho khi client chỉ muốn sửa 1 field không liên quan (vd: note).
      if (dto.productId !== undefined || dto.kg !== undefined) {
        const stockDate =
          dto.acquiredDate ??
          customer.acquiredDate ??
          dto.lastOrderDate ??
          customer.lastOrderDate;
        await this.syncMainStockEntry(
          tx,
          customer,
          // LƯU Ý: dùng "!== undefined ? :" thay vì "??" — vì "??" coi null cũng là
          // nullish nên sẽ SAI khi client cố tình gửi null để BỎ CHỌN sản phẩm
          // (client gửi productId=null nghĩa là "xoá", không phải "giữ nguyên").
          dto.productId !== undefined ? dto.productId : customer.productId,
          dto.kg !== undefined ? dto.kg : Number(customer.kg),
          stockDate,
        );
      }

      if (dto.comboId !== undefined) {
        const stockDate =
          dto.acquiredDate ??
          customer.acquiredDate ??
          dto.lastOrderDate ??
          customer.lastOrderDate;
        await this.syncGiftStockEntryFromCombo(
          tx,
          customer,
          dto.comboId,
          stockDate,
        );
      }

      return this.reloadCustomer(tx, id);
    });
  }

  // ==========================================================================
  // XOÁ KHÁCH HÀNG — port từ deleteCustomer(): xoá luôn 2 phiếu kho liên quan
  // ==========================================================================
  async remove(id: number, user: AuthUser) {
    const customer = await this.findRaw(id);
    this.assertOwnership(customer, user);
    return this.prisma.$transaction(async (tx) => {
      // Gỡ liên kết trước rồi mới xoá StockEntry, tránh vướng ràng buộc khoá ngoại 2 chiều
      await tx.customer.update({
        where: { id },
        data: { stockEntryId: null, giftStockEntryId: null },
      });
      if (customer.stockEntryId) {
        await tx.expense.deleteMany({
          where: { stockEntryId: customer.stockEntryId },
        });
        await tx.stockEntry.delete({ where: { id: customer.stockEntryId } });
      }
      if (customer.giftStockEntryId) {
        await tx.expense.deleteMany({
          where: { stockEntryId: customer.giftStockEntryId },
        });
        await tx.stockEntry.delete({
          where: { id: customer.giftStockEntryId },
        });
      }
      await tx.customer.delete({ where: { id } });
      return { success: true };
    });
  }

  // ==========================================================================
  // CÁC HÀM TOGGLE 1 CLICK — port từ togglePaymentStatus/togglePackedStatus/
  // toggleDeliveredStatus/toggleCustomerStage
  // ==========================================================================
  async togglePaymentStatus(id: number, user: AuthUser) {
    const c = await this.findRaw(id);
    this.assertOwnership(c, user);
    return this.prisma.customer.update({
      where: { id },
      data: {
        paymentStatus: c.paymentStatus === 'chua_tra' ? 'da_tra' : 'chua_tra',
      },
    });
  }

  async togglePacked(id: number, user: AuthUser) {
    const c = await this.findRaw(id);
    this.assertOwnership(c, user);
    return this.prisma.customer.update({
      where: { id },
      data: { packed: !c.packed },
    });
  }

  async toggleDelivered(id: number, user: AuthUser) {
    const c = await this.findRaw(id);
    this.assertOwnership(c, user);
    return this.prisma.customer.update({
      where: { id },
      data: { delivered: !c.delivered },
    });
  }

  async toggleStage(id: number, user: AuthUser) {
    const c = await this.findRaw(id);
    this.assertOwnership(c, user);
    // Đang ở CSKH -> chuyển sang Đơn hàng, và ngược lại
    const nextStage = c.stage === 'cskh' ? 'order' : 'cskh';
    return this.prisma.customer.update({
      where: { id },
      data: { stage: nextStage },
    });
  }

  // ---- Chuyển giao khách hàng cho nhân viên khác — CHỈ ADMIN (đã chặn thêm ở
  // controller bằng @Roles('admin'), kiểm tra lại đây cho chắc / phòng khi service
  // được gọi từ nơi khác trong tương lai) ----
  async transfer(id: number, dto: TransferCustomerDto, user: AuthUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException(
        'Chỉ quản trị viên mới được chuyển giao khách hàng.',
      );
    }
    await this.findRaw(id);
    return this.prisma.customer.update({
      where: { id },
      data: { staffUserId: dto.staffUserId ?? null },
    });
  }

  // ==========================================================================
  // "MUA LẠI" — port từ startRepeatOrder(): tạo 1 ĐƠN HÀNG MỚI (dòng mới),
  // giữ nguyên tên/SĐT/địa chỉ/nhân viên phụ trách, xoá trắng số lượng/giá/ngày.
  // ==========================================================================
  async repeatOrder(id: number, user: AuthUser) {
    const c = await this.findRaw(id);
    this.assertOwnership(c, user);
    return this.create(
      {
        name: c.name,
        phone: c.phone ?? '',
        address: c.address ?? '',
        type: c.type,
        note: '',
        kg: 0,
        price: 0,
        staffUserId: c.staffUserId ?? undefined,
        stage: 'order',
        paymentStatus: 'da_tra',
      },
      user,
    );
  }

  // ==========================================================================
  // THỐNG KÊ DASHBOARD — port từ renderStats(). Staff chỉ thấy số liệu của
  // CHÍNH mình phụ trách; admin thấy số liệu toàn hệ thống — khớp đúng với
  // việc findAll() giờ cũng tự lọc theo staffUserId cho staff.
  // ==========================================================================
  async getStats(user: AuthUser) {
    const scope: Prisma.CustomerWhereInput =
      user.role === 'admin' ? {} : { staffUserId: user.userId };
    const [total, cskh, old, lead] = await Promise.all([
      this.prisma.customer.count({ where: scope }),
      this.prisma.customer.count({ where: { ...scope, stage: 'cskh' } }),
      this.prisma.customer.count({ where: { ...scope, type: 'cu' } }),
      this.prisma.customer.count({ where: { ...scope, type: 'tiemnang' } }),
    ]);
    return { total, cskh, old, lead };
  }

  // ---- Số đơn hàng phát sinh HÔM NAY — port từ orderTodayCount trong renderOrders() ----
  async getTodayOrderCount(user: AuthUser) {
    const todayKey = new Date().toISOString().slice(0, 10); // "yyyy-mm-dd" theo giờ UTC server
    const scope: Prisma.CustomerWhereInput =
      user.role === 'admin' ? {} : { staffUserId: user.userId };
    return this.prisma.customer.count({
      where: {
        ...scope,
        price: { gt: 0 },
        OR: [
          { lastOrderDate: todayKey },
          { AND: [{ lastOrderDate: null }, { acquiredDate: todayKey }] },
        ],
      },
    });
  }

  // ==========================================================================
  // HÀM NỘI BỘ: đọc lại khách hàng kèm đầy đủ quan hệ sau khi ghi (dùng chung
  // cho create/update để trả response nhất quán)
  // ==========================================================================
  private async reloadCustomer(tx: Prisma.TransactionClient, id: number) {
    return tx.customer.findUniqueOrThrow({
      where: { id },
      include: {
        combo: true,
        staffUser: true,
        product: true,
        giftProduct: true,
      },
    });
  }

  // ==========================================================================
  // syncMainStockEntry: PORT 1:1 từ syncCustomerStockEntry() gốc.
  // Đồng bộ phiếu XUẤT KHO cho sản phẩm CHÍNH mà khách mua.
  //  - Có productId -> tạo mới (nếu chưa có) hoặc cập nhật phiếu xuất kho đã gắn.
  //  - Không có productId (bỏ chọn sản phẩm) -> xoá phiếu xuất kho đã gắn (nếu có).
  // ==========================================================================
  private async syncMainStockEntry(
    tx: Prisma.TransactionClient,
    customer: Customer,
    productId: number | null,
    kg: number,
    date: string | null | undefined,
  ) {
    if (productId) {
      if (customer.stockEntryId) {
        // Đã có phiếu xuất kho gắn sẵn -> cập nhật lại cho khớp số liệu mới
        await tx.stockEntry.update({
          where: { id: customer.stockEntryId },
          data: {
            productId,
            qty: kg || 0,
            date: date || undefined, // giữ ngày cũ nếu không truyền ngày mới, giống hệt "date || existing.date"
            note: `Xuất bán cho khách hàng: ${customer.name}`,
          },
        });
      } else {
        // Chưa có -> tạo phiếu xuất kho mới, rồi gắn ngược lại vào customer.stockEntryId
        const entry = await tx.stockEntry.create({
          data: {
            type: 'xuat',
            productId,
            qty: kg || 0,
            unitPrice: 0,
            date: date || undefined,
            note: `Xuất bán cho khách hàng: ${customer.name}`,
          },
        });
        await tx.customer.update({
          where: { id: customer.id },
          data: { stockEntryId: entry.id, productId },
        });
        return;
      }
      await tx.customer.update({
        where: { id: customer.id },
        data: { productId },
      });
    } else if (customer.stockEntryId) {
      // Không chọn sản phẩm nào -> gỡ liên kết rồi xoá phiếu xuất kho cũ
      const oldStockEntryId = customer.stockEntryId;
      await tx.customer.update({
        where: { id: customer.id },
        data: { stockEntryId: null, productId: null },
      });
      await tx.stockEntry.delete({ where: { id: oldStockEntryId } });
    } else {
      await tx.customer.update({
        where: { id: customer.id },
        data: { productId: null },
      });
    }
  }

  // ==========================================================================
  // syncGiftStockEntryFromCombo: PORT 1:1 từ syncCustomerGiftStockEntry() gốc.
  // Combo có thể cấu hình 1 sản phẩm TẶNG KÈM (giftProductId/giftQty) — hàm này
  // tự tạo/cập nhật/xoá phiếu xuất kho THỨ 2, độc lập với sản phẩm chính.
  // ==========================================================================
  private async syncGiftStockEntryFromCombo(
    tx: Prisma.TransactionClient,
    customer: Customer,
    comboId: number | null | undefined,
    date: string | null | undefined,
  ) {
    const combo = comboId
      ? await tx.combo.findUnique({ where: { id: comboId } })
      : null;
    const giftProductId = combo?.giftProductId ?? null;
    const giftQty = combo ? Number(combo.giftQty) : 0;

    if (giftProductId && giftQty > 0) {
      if (customer.giftStockEntryId) {
        await tx.stockEntry.update({
          where: { id: customer.giftStockEntryId },
          data: {
            productId: giftProductId,
            qty: giftQty,
            date: date || undefined,
            note: `Quà tặng kèm combo cho khách hàng: ${customer.name}`,
          },
        });
        await tx.customer.update({
          where: { id: customer.id },
          data: { giftProductId },
        });
      } else {
        const entry = await tx.stockEntry.create({
          data: {
            type: 'xuat',
            productId: giftProductId,
            qty: giftQty,
            unitPrice: 0,
            date: date || undefined,
            note: `Quà tặng kèm combo cho khách hàng: ${customer.name}`,
          },
        });
        await tx.customer.update({
          where: { id: customer.id },
          data: { giftStockEntryId: entry.id, giftProductId },
        });
      }
    } else if (customer.giftStockEntryId) {
      const oldGiftId = customer.giftStockEntryId;
      await tx.customer.update({
        where: { id: customer.id },
        data: { giftStockEntryId: null, giftProductId: null },
      });
      await tx.stockEntry.delete({ where: { id: oldGiftId } });
    }
  }
}
