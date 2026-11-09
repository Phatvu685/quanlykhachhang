 // ============================================================================
// PaymentsController: các endpoint liên quan đến VietQR và Webhook ngân hàng
// ============================================================================
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * GET /api/payments/config: lấy thông tin ngân hàng & số tài khoản MB Bank
   * Công khai, frontend gọi để hiển thị mã VietQR
   */
  @Get('config')
  getConfig() {
    return this.paymentsService.getConfig();
  }

  /**
   * GET /api/payments/status/:id: kiểm tra trạng thái thanh toán của 1 khách hàng
   * Dùng cho polling tự động ở modal hoá đơn
   */
  @Get('status/:id')
  async getStatus(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.getPaymentStatus(id);
  }

  /**
   * POST /api/payments/webhook & POST /api/payments/vietqr-webhook:
   * Nhận thông báo biến động số dư khi khách quét mã VietQR MB Bank
   */
  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    return this.paymentsService.handleWebhook(body, headers);
  }

  @Post('vietqr-webhook')
  async handleVietQrWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    return this.paymentsService.handleWebhook(body, headers);
  }

  @Get('qr')
  async getVietQrProxy(
    @Query('amount') amount: string,
    @Query('orderCode') orderCode: string,
    @Res() res: any,
  ) {
    const amt = Math.round(Number(amount) || 0);
    const memo = encodeURIComponent(orderCode || '');
    const url = `https://img.vietqr.io/image/MB-0939803856-qr_only.png?amount=${amt}&addInfo=${memo}&accountName=${encodeURIComponent('NGUYEN AI THI')}`;
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(Buffer.from(buffer));
    } catch (e) {
      res.status(500).send('Error fetching QR');
    }
  }

  @Get('qr-base64')
  async getVietQrBase64(
    @Query('amount') amount: string,
    @Query('orderCode') orderCode: string,
  ) {
    const amt = Math.round(Number(amount) || 0);
    const memo = encodeURIComponent(orderCode || '');
    const url = `https://img.vietqr.io/image/MB-0939803856-qr_only.png?amount=${amt}&addInfo=${memo}&accountName=${encodeURIComponent('NGUYEN AI THI')}`;
    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return { dataUrl: `data:image/png;base64,${base64}` };
    } catch (e) {
      return { dataUrl: null };
    }
  }

  /**
   * POST /api/payments/simulate/:id: kiểm thử xác nhận thanh toán nhanh (Yêu cầu đăng nhập)
   */
  @Post('simulate/:id')
  @UseGuards(JwtAuthGuard)
  async simulatePayment(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.simulatePayment(id);
  }
}
