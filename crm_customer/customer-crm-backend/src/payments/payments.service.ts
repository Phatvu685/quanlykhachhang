// ============================================================================
// PaymentsService: xử lý thanh toán online qua VietQR và Webhook ngân hàng
// - Cung cấp thông tin tài khoản MB Bank (STK 0939803856, NGUYEN AI THI)
// - Tiếp nhận Webhook từ ngân hàng / Casso / SeAPay / VietQR khi khách chuyển khoản
// - Tự động bóc tách mã đơn HD{id} và chuyển trạng thái đơn sang 'da_tra'
// ============================================================================
import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Cấu hình tài khoản nhận tiền VietQR (đọc từ .env hoặc lấy mặc định MB Bank)
   */
  getConfig() {
    return {
      bankId: this.config.get<string>('VIETQR_BANK_ID') || 'MB',
      accountNo: this.config.get<string>('VIETQR_ACCOUNT_NO') || '0939803856',
      accountName:
        this.config.get<string>('VIETQR_ACCOUNT_NAME') || 'NGUYEN AI THI',
      template: this.config.get<string>('VIETQR_TEMPLATE') || 'compact',
    };
  }

  /**
   * Kiểm tra nhanh trạng thái thanh toán của 1 khách hàng / đơn hàng
   * Dùng cho Frontend Polling khi đang mở Modal Hóa Đơn
   */
  async getPaymentStatus(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        price: true,
        paymentStatus: true,
        updatedAt: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${customerId}`);
    }

    return {
      id: customer.id,
      name: customer.name,
      price: Number(customer.price),
      paymentStatus: customer.paymentStatus,
      isPaid: customer.paymentStatus !== 'chua_tra',
      updatedAt: customer.updatedAt,
    };
  }

  /**
   * Xử lý Webhook biến động số dư khi khách chuyển tiền qua VietQR
   * Hỗ trợ định dạng của Casso.vn, SeAPay, PayOS, hoặc webhook tuỳ biến
   */
  async handleWebhook(body: any, headers?: Record<string, any>) {
    this.logger.log(`Nhận Webhook thanh toán: ${JSON.stringify(body)}`);

    const configuredSecret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (configuredSecret) {
      const incomingSecret =
        headers?.['secure-token'] ||
        headers?.['x-api-key'] ||
        headers?.['authorization']?.replace(/^Bearer\s+/i, '');

      if (incomingSecret && incomingSecret !== configuredSecret) {
        this.logger.warn('Webhook secret không khớp, từ chối xử lý');
        return { success: false, message: 'Sai secret token' };
      }
    }

    // Chuẩn hoá dữ liệu giao dịch về dạng danh sách [ { amount, description, orderCode } ]
    const transactions: Array<{
      amount: number;
      description: string;
      orderCode?: number | string;
    }> = [];

    const rawList = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.transactions)
        ? body.transactions
        : Array.isArray(body)
          ? body
          : [body?.data || body];

    for (const item of rawList) {
      if (!item || typeof item !== 'object') continue;
      transactions.push({
        amount: Number(item.amount) || 0,
        description: String(
          item.description || item.content || item.memo || '',
        ),
        orderCode: item.orderCode ?? item.orderId ?? item.id,
      });
    }

    const updatedCustomerIds: number[] = [];

    for (const tx of transactions) {
      if (tx.amount <= 0 && !tx.orderCode && !tx.description) continue;

      let customerId: number | null = null;

      // 1. Nếu có orderCode số (do VietQR API gửi thẳng mã đơn)
      if (tx.orderCode && !isNaN(Number(tx.orderCode))) {
        customerId = Number(tx.orderCode);
      }

      // 2. Nếu chưa có, quét mã trong nội dung chuyển khoản: HD12, HD 12, DH12, CRM12
      if (!customerId && tx.description) {
        const match =
          tx.description.match(/(?:HD|DH|CRM)[\s-_]*0*(\d+)/i) ||
          tx.description.match(/\b0*(\d+)\b/);
        if (match) {
          customerId = parseInt(match[1], 10);
        }
      }

      if (!customerId || isNaN(customerId)) continue;

      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        this.logger.warn(`Không tìm thấy đơn hàng với mã ID: ${customerId}`);
        continue;
      }

      if (customer.paymentStatus === 'chua_tra') {
        const timeNow = new Date().toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
        });
        const noteAdd = `\n[VietQR: Đã nhận ${tx.amount.toLocaleString('vi-VN')}đ vào MB Bank lúc ${timeNow}]`;

        await this.prisma.customer.update({
          where: { id: customerId },
          data: {
            paymentStatus: 'da_tra',
            note: (customer.note || '').trim() + noteAdd,
          },
        });

        updatedCustomerIds.push(customerId);
        this.logger.log(
          `✅ Đơn hàng #${customerId} đã tự động chuyển sang ĐÃ THANH TOÁN (Số tiền: ${tx.amount})`,
        );
      }
    }

    return {
      success: true,
      processedTransactions: transactions.length,
      updatedCount: updatedCustomerIds.length,
      updatedCustomerIds,
    };
  }

  /**
   * Mô phỏng thanh toán (Test Mode) dùng trong quá trình kiểm thử
   */
  async simulatePayment(customerId: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${customerId}`);
    }

    const timeNow = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const noteAdd = `\n[VietQR TEST: Xác nhận thanh toán qua MB Bank lúc ${timeNow}]`;

    return this.prisma.customer.update({
      where: { id: customerId },
      data: {
        paymentStatus: 'da_tra',
        note: (customer.note || '').trim() + noteAdd,
      },
    });
  }
}
