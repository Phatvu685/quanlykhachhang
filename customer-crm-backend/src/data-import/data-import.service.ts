// ============================================================================
// DataImportService: xử lý nhập (import) và xuất (export) dữ liệu JSON
// Hỗ trợ cả 5 category riêng biệt:
// 1. combos.json (Combo ưu đãi)
// 2. customers.json (Khách hàng & Đơn hàng & CSKH)
// 3. expenses.json (Sổ dòng tiền)
// 4. products.json (Sản phẩm kho)
// 5. stock-entries.json (Sổ kho nhập/xuất)
// hoặc file sao lưu tổng hợp.
// ============================================================================
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CustomerStage, CustomerType, ExpenseKind, OfferType, PaymentStatus, StockType } from '@prisma/client';

export interface ImportOptions {
  mode?: 'merge' | 'upsert' | 'replace';
  category?: 'customers' | 'products' | 'combos' | 'stock-entries' | 'expenses' | 'all';
  filename?: string;
}

@Injectable()
export class DataImportService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // XUẤT DỮ LIỆU JSON (EXPORT)
  // ==========================================================================
  async exportData(user: AuthUser, category?: string) {
    const customerWhere = user.role === 'admin' ? {} : { staffUserId: user.userId };

    const [customers, products, combos, stockEntries, expenses, socialAccounts] = await Promise.all([
      this.prisma.customer.findMany({
        where: customerWhere,
        include: {
          combo: true,
          product: true,
          staffUser: { select: { id: true, username: true, role: true } },
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.product.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.combo.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.stockEntry.findMany({
        include: { product: true },
        orderBy: { id: 'asc' },
      }),
      this.prisma.expense.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.socialAccount.findMany({ orderBy: { id: 'asc' } }),
    ]);

    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      type: c.type,
      note: c.note,
      kg: Number(c.kg),
      price: Number(c.price),
      stage: c.stage,
      paymentStatus: c.paymentStatus,
      packed: c.packed,
      delivered: c.delivered,
      acquiredDate: c.acquiredDate,
      lastOrderDate: c.lastOrderDate,
      deliveryDate: c.deliveryDate,
      nextContactDate: c.nextContactDate,
      productId: c.productId,
      productName: c.product?.name ?? null,
      comboId: c.comboId,
      comboName: c.combo?.name ?? null,
      staffUserId: c.staffUserId,
      staff: c.staffUser?.username ?? null,
    }));

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      minStock: p.minStock,
      sellPrice: Number(p.sellPrice),
      note: p.note,
    }));

    const formattedCombos = combos.map((cb) => ({
      id: cb.id,
      name: cb.name,
      desc: cb.desc,
      productId: cb.productId,
      productName: cb.productName,
      unit: cb.unit,
      baseKg: Number(cb.baseKg),
      unitPrice: Number(cb.unitPrice),
      offerType: cb.offerType,
      offerValue: Number(cb.offerValue),
      giftProductId: cb.giftProductId,
      giftQty: Number(cb.giftQty),
    }));

    const formattedStockEntries = stockEntries.map((s) => ({
      id: s.id,
      type: s.type,
      productId: s.productId,
      productName: s.product?.name ?? null,
      qty: Number(s.qty),
      unitPrice: Number(s.unitPrice),
      supplier: s.supplier,
      date: s.date,
      note: s.note,
    }));

    const formattedExpenses = expenses.map((e) => ({
      id: e.id,
      kind: e.kind,
      name: e.name,
      amount: Number(e.amount),
      date: e.date,
      note: e.note,
      autoStock: e.autoStock,
    }));

    // Xuất theo từng category đơn lẻ nếu có yêu cầu
    if (category === 'customers') return formattedCustomers;
    if (category === 'products') return formattedProducts;
    if (category === 'combos') return formattedCombos;
    if (category === 'stock-entries' || category === 'stockEntries') return formattedStockEntries;
    if (category === 'expenses') return formattedExpenses;

    // Mặc định xuất file tổng hợp
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user.username,
      customers: formattedCustomers,
      products: formattedProducts,
      combos: formattedCombos,
      stockEntries: formattedStockEntries,
      expenses: formattedExpenses,
      socialAccounts: socialAccounts.map((a) => ({
        id: a.id,
        resource: a.resource,
        username: a.username,
        password: a.password,
      })),
    };
  }

  // ==========================================================================
  // NHẬP DỮ LIỆU JSON (IMPORT)
  // ==========================================================================
  async importData(payload: any, options: ImportOptions, user: AuthUser) {
    if (!payload) {
      throw new BadRequestException('Dữ liệu JSON rỗng.');
    }

    const mode = options?.mode || 'merge';
    const categoryHint = options?.category || '';
    const filename = (options?.filename || '').toLowerCase();

    // Chuẩn hoá payload đầu vào
    let customersList: any[] = [];
    let productsList: any[] = [];
    let combosList: any[] = [];
    let stockEntriesList: any[] = [];
    let expensesList: any[] = [];
    let socialAccountsList: any[] = [];

    // Tự động suy luận category từ filename nếu có (vd: combos.json, products.json, ...)
    let inferredCat = categoryHint;
    if (!inferredCat) {
      if (filename.includes('combo')) inferredCat = 'combos';
      else if (filename.includes('product') || filename.includes('sanpham')) inferredCat = 'products';
      else if (filename.includes('stock') || filename.includes('kho')) inferredCat = 'stock-entries';
      else if (filename.includes('expense') || filename.includes('chiphi') || filename.includes('cashflow')) inferredCat = 'expenses';
      else if (filename.includes('customer') || filename.includes('khachhang') || filename.includes('order')) inferredCat = 'customers';
    }

    if (Array.isArray(payload)) {
      if (inferredCat === 'combos') {
        combosList = payload;
      } else if (inferredCat === 'products') {
        productsList = payload;
      } else if (inferredCat === 'stock-entries') {
        stockEntriesList = payload;
      } else if (inferredCat === 'expenses') {
        expensesList = payload;
      } else if (inferredCat === 'customers') {
        customersList = payload;
      } else {
        // Tự động phân tích theo các trường dữ liệu của phần tử đầu tiên
        const first = payload[0] || {};
        if (first.minStock !== undefined || (first.sellPrice !== undefined && !first.phone && !first.stage)) {
          productsList = payload;
        } else if (first.offerType !== undefined || first.giftProductId !== undefined || first.baseKg !== undefined) {
          combosList = payload;
        } else if (first.kind !== undefined || (first.type && ['chi_phi', 'von', 'hoan_von'].includes(first.type))) {
          expensesList = payload;
        } else if (first.supplier !== undefined || (first.type && ['nhap', 'xuat'].includes(first.type) && !first.phone)) {
          stockEntriesList = payload;
        } else if (first.resource !== undefined && first.password !== undefined && !first.phone) {
          socialAccountsList = payload;
        } else {
          customersList = payload;
        }
      }
    } else if (typeof payload === 'object') {
      const root = payload.data || payload.items || payload;

      if (Array.isArray(root)) {
        if (inferredCat === 'combos') combosList = root;
        else if (inferredCat === 'products') productsList = root;
        else if (inferredCat === 'stock-entries') stockEntriesList = root;
        else if (inferredCat === 'expenses') expensesList = root;
        else customersList = root;
      } else {
        customersList = Array.isArray(root.customers)
          ? root.customers
          : Array.isArray(root.khachHang)
            ? root.khachHang
            : Array.isArray(root.orders)
              ? root.orders
              : [];
        productsList = Array.isArray(root.products)
          ? root.products
          : Array.isArray(root.sanPham)
            ? root.sanPham
            : [];
        combosList = Array.isArray(root.combos) ? root.combos : [];
        stockEntriesList = Array.isArray(root.stockEntries)
          ? root.stockEntries
          : Array.isArray(root.kho)
            ? root.kho
            : [];
        expensesList = Array.isArray(root.expenses)
          ? root.expenses
          : Array.isArray(root.chiPhi)
            ? root.chiPhi
            : [];
        socialAccountsList = Array.isArray(root.socialAccounts)
          ? root.socialAccounts
          : Array.isArray(root.taiKhoan)
            ? root.taiKhoan
            : [];
      }
    } else {
      throw new BadRequestException('Định dạng JSON không hợp lệ.');
    }

    const counts = {
      customers: 0,
      products: 0,
      combos: 0,
      stockEntries: 0,
      expenses: 0,
      socialAccounts: 0,
    };

    // Danh mục users để map username -> id
    const allUsers = await this.prisma.user.findMany({ select: { id: true, username: true } });
    const userIdByUsername = new Map<string, number>();
    for (const u of allUsers) {
      userIdByUsername.set(u.username.toLowerCase(), u.id);
    }

    // Danh mục Products hiện có
    const existingProducts = await this.prisma.product.findMany();
    const productIdByName = new Map<string, number>();
    const productById = new Map<number, typeof existingProducts[0]>();
    for (const p of existingProducts) {
      productIdByName.set(p.name.trim().toLowerCase(), p.id);
      productById.set(p.id, p);
    }

    // Danh mục Combos hiện có
    const existingCombos = await this.prisma.combo.findMany();
    const comboIdByName = new Map<string, number>();
    const comboById = new Map<number, typeof existingCombos[0]>();
    for (const cb of existingCombos) {
      comboIdByName.set(cb.name.trim().toLowerCase(), cb.id);
      comboById.set(cb.id, cb);
    }

    // Hàm tiện ích: lấy hoặc tạo mới Product tự động nếu được tham chiếu
    const getOrCreateProduct = async (prodName?: string | null, prodId?: number | null): Promise<number | null> => {
      if (prodId && productById.has(prodId)) return prodId;
      if (!prodName || !prodName.trim()) return null;
      const clean = prodName.trim();
      const existingId = productIdByName.get(clean.toLowerCase());
      if (existingId) return existingId;
      const newProd = await this.prisma.product.create({
        data: { name: clean, unit: 'kg', minStock: 0, sellPrice: 0 },
      });
      productIdByName.set(clean.toLowerCase(), newProd.id);
      productById.set(newProd.id, newProd);
      return newProd.id;
    };

    // ========================================================================
    // 1. IMPORT PRODUCTS (products.json)
    // ========================================================================
    for (const p of productsList) {
      const name = String(p.name || p.ten || '').trim();
      if (!name) continue;

      const unit = String(p.unit || p.donVi || 'kg').trim();
      const minStock = Number(p.minStock ?? p.dinhMuc ?? 0) || 0;
      const sellPrice = Number(p.sellPrice ?? p.giaBan ?? 0) || 0;
      const note = p.note || p.ghiChu ? String(p.note || p.ghiChu) : null;

      const foundId = (p.id && productById.has(Number(p.id))) ? Number(p.id) : productIdByName.get(name.toLowerCase());
      if (mode === 'upsert' && foundId) {
        const updated = await this.prisma.product.update({
          where: { id: foundId },
          data: { name, unit, minStock, sellPrice, note },
        });
        productById.set(updated.id, updated);
      } else {
        const created = await this.prisma.product.create({
          data: { name, unit, minStock, sellPrice, note },
        });
        productIdByName.set(name.toLowerCase(), created.id);
        productById.set(created.id, created);
      }
      counts.products++;
    }

    // ========================================================================
    // 2. IMPORT COMBOS (combos.json)
    // ========================================================================
    for (const cb of combosList) {
      const name = String(cb.name || cb.ten || '').trim();
      if (!name) continue;

      let productId = await getOrCreateProduct(cb.productName, cb.productId ? Number(cb.productId) : null);
      let giftProductId = await getOrCreateProduct(cb.giftProductName, cb.giftProductId ? Number(cb.giftProductId) : null);

      const offerType: OfferType = ['money', 'kg'].includes(cb.offerType || cb.loaiUuDai)
        ? (cb.offerType || cb.loaiUuDai)
        : 'percent';
      const offerValue = Number(cb.offerValue ?? cb.giaTriUuDai ?? 0) || 0;
      const baseKg = Number(cb.baseKg ?? cb.soLuong ?? 0) || 0;
      const unitPrice = Number(cb.unitPrice ?? cb.donGia ?? 0) || 0;
      const giftQty = Number(cb.giftQty ?? cb.soLuongTang ?? 0) || 0;
      const desc = cb.desc || cb.moTa ? String(cb.desc || cb.moTa) : null;
      const unit = String(cb.unit || cb.donVi || 'kg');
      const prodName = cb.productName ? String(cb.productName) : (productId ? productById.get(productId)?.name ?? null : null);

      const foundId = (cb.id && comboById.has(Number(cb.id))) ? Number(cb.id) : comboIdByName.get(name.toLowerCase());
      if (mode === 'upsert' && foundId) {
        const updated = await this.prisma.combo.update({
          where: { id: foundId },
          data: {
            name,
            desc,
            productId,
            productName: prodName,
            unit,
            baseKg,
            unitPrice,
            offerType,
            offerValue,
            giftProductId,
            giftQty,
          },
        });
        comboById.set(updated.id, updated);
      } else {
        const created = await this.prisma.combo.create({
          data: {
            name,
            desc,
            productId,
            productName: prodName,
            unit,
            baseKg,
            unitPrice,
            offerType,
            offerValue,
            giftProductId,
            giftQty,
          },
        });
        comboIdByName.set(name.toLowerCase(), created.id);
        comboById.set(created.id, created);
      }
      counts.combos++;
    }

    // ========================================================================
    // 3. IMPORT CUSTOMERS (customers.json)
    // ========================================================================
    for (const c of customersList) {
      const name = String(c.name || c.ten || c.hoTen || c.customerName || '').trim();
      if (!name) continue;

      const rawPhone = String(c.phone || c.sdt || c.soDienThoai || '').trim();
      const phone = rawPhone;
      const address = c.address || c.diaChi ? String(c.address || c.diaChi).trim() : null;
      const note = c.note || c.ghiChu ? String(c.note || c.ghiChu) : null;

      // Phân loại khách: moi / cu / tiemnang
      let type: CustomerType = 'moi';
      const rawType = String(c.type || c.phanLoai || '').toLowerCase();
      if (rawType.includes('cu') || rawType === 'old') type = 'cu';
      else if (rawType.includes('tiem') || rawType === 'lead') type = 'tiemnang';

      // Giai đoạn: order (đơn hàng) / cskh
      let stage: CustomerStage = 'order';
      const rawStage = String(c.stage || c.giaiDoan || '').toLowerCase();
      if (rawStage.includes('cskh') || rawStage.includes('care')) stage = 'cskh';

      // Trạng thái thanh toán
      let paymentStatus: PaymentStatus = 'da_tra';
      const rawPay = c.paymentStatus || c.thanhToan;
      if (rawPay === 'chua_tra' || rawPay === false || rawPay === 'unpaid' || String(rawPay).includes('chưa')) {
        paymentStatus = 'chua_tra';
      }

      const kg = Number(c.kg ?? c.soLuong ?? 0) || 0;
      const price = Number(c.price ?? c.gia ?? c.tongTien ?? c.thanhTien ?? 0) || 0;
      const packed = Boolean(c.packed ?? c.daDongGoi ?? false);
      const delivered = Boolean(c.delivered ?? c.daGiaoHang ?? false);

      const acquiredDate = c.acquiredDate || c.ngayTiepCan || c.date || null;
      const lastOrderDate = c.lastOrderDate || c.ngayDatDon || null;
      const deliveryDate = c.deliveryDate || c.ngayGiaoHang || null;
      const nextContactDate = c.nextContactDate || c.ngayHen || null;

      // Nhân viên phụ trách
      let staffUserId: number | null = null;
      if (user.role !== 'admin') {
        staffUserId = user.userId;
      } else {
        if (c.staffUserId && typeof c.staffUserId === 'number') {
          staffUserId = c.staffUserId;
        } else if (c.staff || c.staffUsername || c.nhanVien) {
          const staffKey = String(c.staff || c.staffUsername || c.nhanVien).trim().toLowerCase();
          staffUserId = userIdByUsername.get(staffKey) ?? null;
        }
      }

      // Sản phẩm chính
      let productId = await getOrCreateProduct(c.productName || c.sanPham, c.productId ? Number(c.productId) : null);

      // Combo
      let comboId: number | null = null;
      if (c.comboId && typeof c.comboId === 'number' && comboById.has(c.comboId)) {
        comboId = c.comboId;
      } else if (c.comboName || c.combo) {
        const cName = String(c.comboName || c.combo).trim().toLowerCase();
        comboId = comboIdByName.get(cName) ?? null;
      }

      let existingCustomer: any = null;
      if (mode === 'upsert') {
        if (c.id && typeof c.id === 'number') {
          existingCustomer = await this.prisma.customer.findUnique({ where: { id: c.id } });
        } else if (phone) {
          existingCustomer = await this.prisma.customer.findFirst({
            where: {
              phone,
              ...(user.role !== 'admin' ? { staffUserId: user.userId } : {}),
            },
          });
        }
      }

      if (existingCustomer) {
        await this.prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name,
            phone,
            address,
            note,
            type,
            stage,
            paymentStatus,
            kg,
            price,
            packed,
            delivered,
            acquiredDate,
            lastOrderDate,
            deliveryDate,
            nextContactDate,
            productId: productId ?? existingCustomer.productId,
            comboId: comboId ?? existingCustomer.comboId,
            ...(user.role === 'admin' && staffUserId !== null ? { staffUserId } : {}),
          },
        });
      } else {
        await this.prisma.customer.create({
          data: {
            name,
            phone,
            address,
            note,
            type,
            stage,
            paymentStatus,
            kg,
            price,
            packed,
            delivered,
            acquiredDate,
            lastOrderDate,
            deliveryDate,
            nextContactDate,
            productId,
            comboId,
            staffUserId,
          },
        });
      }
      counts.customers++;
    }

    // ========================================================================
    // 4. IMPORT STOCK ENTRIES (stock-entries.json)
    // ========================================================================
    for (const s of stockEntriesList) {
      let productId = await getOrCreateProduct(s.productName || s.sanPham, s.productId ? Number(s.productId) : null);
      if (!productId) {
        // Nếu không có sản phẩm chỉ định, liên kết tới sản phẩm đầu tiên có sẵn
        const firstProd = Array.from(productById.values())[0];
        if (firstProd) productId = firstProd.id;
        else productId = await getOrCreateProduct('Sản phẩm chung', null);
      }

      const type: StockType = s.type === 'xuat' ? 'xuat' : 'nhap';
      const qty = Number(s.qty ?? s.soLuong ?? 0) || 0;
      const unitPrice = Number(s.unitPrice ?? s.donGia ?? 0) || 0;
      const supplier = s.supplier || s.nhaCungCap ? String(s.supplier || s.nhaCungCap) : null;
      const date = s.date || s.ngay ? String(s.date || s.ngay) : null;
      const note = s.note || s.ghiChu ? String(s.note || s.ghiChu) : null;

      if (mode === 'upsert' && s.id && typeof s.id === 'number') {
        const found = await this.prisma.stockEntry.findUnique({ where: { id: s.id } });
        if (found) {
          await this.prisma.stockEntry.update({
            where: { id: s.id },
            data: { type, productId: productId!, qty, unitPrice, supplier, date, note },
          });
          counts.stockEntries++;
          continue;
        }
      }

      await this.prisma.stockEntry.create({
        data: {
          type,
          productId: productId!,
          qty,
          unitPrice,
          supplier,
          date,
          note,
        },
      });
      counts.stockEntries++;
    }

    // ========================================================================
    // 5. IMPORT EXPENSES (expenses.json)
    // ========================================================================
    for (const e of expensesList) {
      const name = String(e.name || e.ten || '').trim();
      if (!name) continue;

      let kind: ExpenseKind = 'chi_phi';
      const rawKind = String(e.kind || e.type || '').toLowerCase();
      if (rawKind === 'von') kind = 'von';
      else if (rawKind === 'hoan_von') kind = 'hoan_von';

      const amount = Number(e.amount ?? e.soTien ?? 0) || 0;
      const date = e.date || e.ngay ? String(e.date || e.ngay) : null;
      const note = e.note || e.ghiChu ? String(e.note || e.ghiChu) : null;

      if (mode === 'upsert' && e.id && typeof e.id === 'number') {
        const found = await this.prisma.expense.findUnique({ where: { id: e.id } });
        if (found) {
          await this.prisma.expense.update({
            where: { id: e.id },
            data: { kind, name, amount, date, note },
          });
          counts.expenses++;
          continue;
        }
      }

      await this.prisma.expense.create({
        data: {
          kind,
          name,
          amount,
          date,
          note,
          autoStock: false,
        },
      });
      counts.expenses++;
    }

    // ========================================================================
    // 6. IMPORT SOCIAL ACCOUNTS
    // ========================================================================
    for (const a of socialAccountsList) {
      const resource = String(a.resource || a.nenTang || 'Zalo').trim();
      const username = String(a.username || a.taiKhoan || '').trim();
      const password = String(a.password || a.matKhau || '').trim();
      if (!username) continue;

      await this.prisma.socialAccount.create({
        data: { resource, username, password },
      });
      counts.socialAccounts++;
    }

    const messages: string[] = [];
    if (counts.customers > 0) messages.push(`${counts.customers} khách hàng`);
    if (counts.products > 0) messages.push(`${counts.products} sản phẩm`);
    if (counts.combos > 0) messages.push(`${counts.combos} combo`);
    if (counts.stockEntries > 0) messages.push(`${counts.stockEntries} phiếu kho`);
    if (counts.expenses > 0) messages.push(`${counts.expenses} khoản dòng tiền`);
    if (counts.socialAccounts > 0) messages.push(`${counts.socialAccounts} tài khoản MXH`);

    return {
      success: true,
      counts,
      message: messages.length
        ? `Đã nhập thành công: ${messages.join(', ')}.`
        : 'Không có dữ liệu hợp lệ nào được nhập.',
    };
  }
}
