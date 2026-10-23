// ============================================================================
// CombosService: CRUD combo + các hàm tính toán giá được PORT NGUYÊN VẸN logic
// từ file gốc (comboBasePrice, comboTotalKg, comboFinalPrice) để backend và
// frontend luôn thống nhất 1 công thức, tránh lệch số liệu.
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateComboDto } from './dto/create-combo.dto';
import { UpdateComboDto } from './dto/update-combo.dto';

@Injectable()
export class CombosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const combos = await this.prisma.combo.findMany({
      // include quan hệ để trả kèm tên sản phẩm chính + sản phẩm quà tặng, khỏi phải query thêm
      include: { product: true, giftProduct: true },
      orderBy: { id: 'asc' },
    });
    // đính kèm các trường tính toán (basePrice, totalKg, finalPrice) vào từng combo
    return combos.map((c) => ({ ...c, ...this.computeDerivedFields(c) }));
  }

  async findOne(id: number) {
    const combo = await this.prisma.combo.findUnique({
      where: { id },
      include: { product: true, giftProduct: true },
    });
    if (!combo) throw new NotFoundException(`Không tìm thấy combo id=${id}`);
    return { ...combo, ...this.computeDerivedFields(combo) };
  }

  async create(dto: CreateComboDto) {
    const created = await this.prisma.combo.create({
      data: {
        name: dto.name,
        desc: dto.desc,
        productId: dto.productId,
        unit: dto.unit ?? 'kg',
        baseKg: dto.baseKg,
        unitPrice: dto.unitPrice,
        offerType: dto.offerType,
        offerValue: dto.offerValue,
        giftProductId: dto.giftProductId,
        giftQty: dto.giftQty ?? 0,
      },
      include: { product: true, giftProduct: true },
    });
    return { ...created, ...this.computeDerivedFields(created) };
  }

  async update(id: number, dto: UpdateComboDto) {
    await this.findOne(id);
    const updated = await this.prisma.combo.update({
      where: { id },
      data: dto,
      include: { product: true, giftProduct: true },
    });
    return { ...updated, ...this.computeDerivedFields(updated) };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.combo.delete({ where: { id } });
    return { success: true };
  }

  // ==========================================================================
  // Các hàm thuần (pure function) port lại 1:1 từ script.js gốc:
  //   comboBasePrice(c), comboTotalKg(c), comboFinalPrice(c)
  // ==========================================================================
  private comboBasePrice(baseKg: number, unitPrice: number): number {
    // Giá gốc = số lượng gốc * đơn giá
    return (Number(baseKg) || 0) * (Number(unitPrice) || 0);
  }

  private comboTotalKg(
    baseKg: number,
    offerType: string,
    offerValue: number,
  ): number {
    const base = Number(baseKg) || 0;
    // Nếu ưu đãi kiểu "tặng thêm kg" -> tổng kg khách nhận = gốc + phần tặng
    if (offerType === 'kg') return base + (Number(offerValue) || 0);
    return base;
  }

  private comboFinalPrice(
    baseKg: number,
    unitPrice: number,
    offerType: string,
    offerValue: number,
  ): number {
    const base = this.comboBasePrice(baseKg, unitPrice);
    const val = Number(offerValue) || 0;
    if (offerType === 'percent') return Math.max(0, base * (1 - val / 100)); // giảm theo %
    if (offerType === 'money') return Math.max(0, base - val); // giảm trừ thẳng số tiền
    return base; // offerType === 'kg': giá giữ nguyên, chỉ tặng thêm hàng
  }

  // Gom 3 hàm trên lại, trả về object để spread (...) thẳng vào response
  private computeDerivedFields(c: {
    baseKg: any;
    unitPrice: any;
    offerType: string;
    offerValue: any;
  }) {
    const baseKg = Number(c.baseKg);
    const unitPrice = Number(c.unitPrice);
    const offerValue = Number(c.offerValue);
    return {
      basePrice: this.comboBasePrice(baseKg, unitPrice),
      totalKg: this.comboTotalKg(baseKg, c.offerType, offerValue),
      finalPrice: this.comboFinalPrice(
        baseKg,
        unitPrice,
        c.offerType,
        offerValue,
      ),
    };
  }
}
