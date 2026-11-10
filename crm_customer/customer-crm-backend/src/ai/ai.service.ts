import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatDto } from './dto/chat.dto';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async chat(dto: ChatDto, user?: AuthUser) {
    const rawApiKey =
      dto.apiKey ||
      this.configService.get<string>('AI_API_KEY') ||
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('DEEPSEEK_API_KEY') ||
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      '';
    const apiKey = rawApiKey.trim();

    if (!apiKey) {
      return {
        reply: `⚠️ Hệ thống chưa nhận được API Key để kích hoạt AI.\n\n👉 Vui lòng bấm vào biểu tượng **⚙️** trên góc cửa sổ chat, dán mã API Key của bạn (hỗ trợ **DeepSeek**, **Groq (Miễn phí)**, **Google Gemini**, **OpenAI**) và bấm **Lưu cài đặt** để AI tra cứu toàn bộ dữ liệu dự án!`,
        source: 'no_api_key',
      };
    }

    // 1. Thu thập TOÀN BỘ dữ liệu dự án thời gian thực từ Postgres
    const fullContext = await this.getFullProjectContext(user);

    // 2. Tự động nhận diện nhà cung cấp AI dựa vào định dạng Key
    try {
      // TH 1: Groq Key (bắt đầu bằng gsk_ - 100% Free siêu tốc độ)
      if (apiKey.startsWith('gsk_')) {
        this.logger.log('Routing to Groq API (llama-3.3-70b-versatile)...');
        const reply = await this.callOpenAiCompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          apiKey,
          'llama-3.3-70b-versatile',
          dto,
          fullContext,
          'Groq',
        );
        return { reply, source: 'groq' };
      }

      // TH 2: Google Gemini (bắt đầu bằng AIzaSy hoặc AQ.)
      if (apiKey.startsWith('AIzaSy') || apiKey.startsWith('AQ.')) {
        this.logger.log('Routing to Google Gemini API...');
        const reply = await this.callGeminiApi(apiKey, dto, fullContext);
        return { reply, source: 'gemini' };
      }

      // TH 3: DeepSeek hoặc OpenAI (bắt đầu bằng sk-)
      if (apiKey.startsWith('sk-')) {
        this.logger.log('Routing to DeepSeek API...');
        return await this.callDeepSeek(apiKey, dto, fullContext);
      }

      // Mặc định: Thử gọi DeepSeek
      return await this.callDeepSeek(apiKey, dto, fullContext);
    } catch (err: any) {
      this.logger.error(`AI API Execution Error: ${err.message}`, err.stack);
      return {
        reply: `⚠️ Lỗi khi kết nối AI: ${err.message}`,
        source: 'ai_error',
      };
    }
  }

  /**
   * Gọi DeepSeek API với model deepseek-chat
   */
  private async callDeepSeek(apiKey: string, dto: ChatDto, context: any) {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = this.buildOpenAiMessages(systemPrompt, dto);

    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.3,
          max_tokens: 2500,
        }),
        signal: AbortSignal.timeout(25000),
      });

      // Bắt lỗi Insufficient Balance đặc trưng của DeepSeek
      if (res.status === 402) {
        this.logger.warn('DeepSeek returned HTTP 402 Insufficient Balance');
        return {
          reply:
            `⚠️ **Tài khoản DeepSeek của bạn chưa có số dư (Insufficient Balance)**:\n\n` +
            `Mã API Key DeepSeek của bạn (\`${apiKey.slice(0, 8)}...${apiKey.slice(-4)}\`) là chính xác và đã kết nối thành công tới máy chủ DeepSeek!\n\n` +
            `Tuy nhiên DeepSeek yêu cầu tài khoản phải nạp tối thiểu $2 (khoảng 50.000đ) tại [https://platform.deepseek.com/top_up](https://platform.deepseek.com/top_up) thì mới cho phép gửi tin nhắn qua API.\n\n` +
            `💡 **Nếu bạn muốn dùng AI HOÀN TOÀN MIỄN PHÍ 100% (không cần nạp tiền, không cần thẻ ngân hàng):**\n` +
            `1. Truy cập **Groq**: [https://console.groq.com/keys](https://console.groq.com/keys)\n` +
            `2. Đăng nhập bằng Gmail, bấm **Create API Key**, copy mã (bắt đầu bằng \`gsk_...\`).\n` +
            `3. Bấm vào biểu tượng **⚙️** trên khung chat CRM này, dán mã Groq vào và bấm **Lưu cài đặt**.\n` +
            `*(Groq chạy mô hình Llama-3.3-70B cực kỳ thông minh, phản hồi cực nhanh chỉ 1 giây và miễn phí hoàn toàn)*`,
          source: 'deepseek_insufficient_balance',
        };
      }

      // Nếu 401 Unauthorized có thể là OpenAI Key
      if (res.status === 401) {
        this.logger.log('DeepSeek returned 401, trying OpenAI fallback...');
        const openAiReply = await this.callOpenAiCompatible(
          'https://api.openai.com/v1/chat/completions',
          apiKey,
          'gpt-4o-mini',
          dto,
          context,
          'OpenAI',
        );
        return { reply: openAiReply, source: 'openai' };
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`DeepSeek HTTP ${res.status}: ${errText}`);
      }

      const data: any = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (!reply) {
        throw new Error('DeepSeek không phản hồi nội dung.');
      }
      return { reply, source: 'deepseek' };
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
        throw new Error('Máy chủ DeepSeek phản hồi quá lâu (Timeout). Vui lòng thử lại.');
      }
      throw err;
    }
  }

  /**
   * Gọi API theo chuẩn OpenAI (Groq, OpenAI, OpenRouter, v.v.)
   */
  private async callOpenAiCompatible(
    endpoint: string,
    apiKey: string,
    model: string,
    dto: ChatDto,
    context: any,
    providerName: string,
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = this.buildOpenAiMessages(systemPrompt, dto);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2500,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`${providerName} HTTP ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error(`${providerName} không phản hồi nội dung.`);
    }
    return reply;
  }

  /**
   * Chuyển đổi dữ liệu và lịch sử hội thoại sang định dạng OpenAI messages
   */
  private buildOpenAiMessages(systemPrompt: string, dto: ChatDto) {
    const messages: any[] = [{ role: 'system', content: systemPrompt }];

    if (dto.history && Array.isArray(dto.history)) {
      for (const h of dto.history.slice(-8)) {
        messages.push({
          role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
          content: h.content,
        });
      }
    }

    messages.push({
      role: 'user',
      content: dto.message,
    });

    return messages;
  }

  /**
   * Thu thập 100% dữ liệu thực tế của toàn bộ dự án từ PostgreSQL
   */
  private async getFullProjectContext(user?: AuthUser) {
    const [customers, products, stockEntries, expenses, combos, users] = await Promise.all([
      this.prisma.customer.findMany({
        include: {
          staffUser: { select: { username: true } },
          product: { select: { name: true, sellPrice: true } },
          combo: { select: { name: true } },
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.product.findMany(),
      this.prisma.stockEntry.findMany({
        orderBy: { date: 'desc' },
        take: 30,
        include: { product: { select: { name: true } } },
      }),
      this.prisma.expense.findMany({
        orderBy: { date: 'desc' },
        take: 40,
      }),
      this.prisma.combo.findMany(),
      this.prisma.user.findMany({
        select: { id: true, username: true, role: true },
      }),
    ]);

    const unpaidList = customers.filter((c) => c.paymentStatus === 'chua_tra');
    const paidList = customers.filter((c) => c.paymentStatus !== 'chua_tra');
    const totalDebtAmount = unpaidList.reduce((s, c) => s + (Number(c.price) || 0), 0);
    const totalPaidRevenue = paidList.reduce((s, c) => s + (Number(c.price) || 0), 0);

    const customersData = customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      type: c.type === 'cu' ? 'Khách cũ' : c.type === 'tiemnang' ? 'Tiềm năng' : 'Khách mới',
      payment: c.paymentStatus === 'chua_tra' ? 'CÔNG_NỢ (chưa trả)' : 'ĐÃ_THU (đã trả)',
      kg: Number(c.kg) || 0,
      price: Number(c.price) || 0,
      product: c.combo?.name ? `Combo: ${c.combo.name}` : c.product?.name ? c.product.name : 'Gạo ST25',
      staff: c.staffUser?.username || 'Chưa phân công',
      date: c.lastOrderDate || c.acquiredDate || '',
      packed: c.packed ? 'Đã đóng' : 'Chưa đóng',
      delivered: c.delivered ? 'Đã giao' : 'Chưa giao',
      note: c.note || '',
    }));

    return {
      overview: {
        totalCustomers: customers.length,
        totalUnpaidCount: unpaidList.length,
        totalDebtAmount,
        totalPaidRevenue,
      },
      customers: customersData,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sellPrice: Number(p.sellPrice) || 0,
        unit: p.unit,
        minStock: Number(p.minStock) || 0,
      })),
      combos: combos.map((cb) => ({
        id: cb.id,
        name: cb.name,
        unitPrice: Number(cb.unitPrice) || 0,
        baseKg: Number(cb.baseKg) || 0,
      })),
      recentExpenses: expenses.map((e) => ({
        name: e.name,
        amount: Number(e.amount) || 0,
        type: e.kind === 'chi_phi' ? 'Chi phí' : e.kind === 'von' ? 'Vốn góp' : 'Hoàn vốn',
        date: e.date,
        note: e.note || '',
      })),
      users: users.map((u) => ({ username: u.username, role: u.role })),
      bankInfo: {
        bank: this.configService.get('VIETQR_BANK_ID') || 'MB',
        accountNo: this.configService.get('VIETQR_ACCOUNT_NO') || '0939803856',
        accountName: this.configService.get('VIETQR_ACCOUNT_NAME') || 'NGUYEN AI THI',
      },
    };
  }

  /**
   * Tạo System Prompt chuẩn hóa cho mọi mô hình AI
   */
  private buildSystemPrompt(context: any): string {
    return `BẠN LÀ CHUYÊN VIÊN TRỢ LÝ AI CAO CẤP CỦA HỆ THỐNG DOANH NGHIỆP "VỊ NGUYÊN FOOD" (Gạo sạch & Nông sản Việt Nam).
BẠN CÓ TOÀN QUYỀN TRUY CẬP VÀ NẮM RÕ 100% TOÀN BỘ CƠ SỞ DỮ LIỆU CỦA DỰ ÁN CRM DƯỚI ĐÂY.

NHIỆM VỤ CỦA BẠN:
1. Trả lời BẤT KỲ câu hỏi nào của người dùng về dự án:
   - Tra cứu chi tiết từng khách hàng (Tên, SĐT, Địa chỉ, số kg, giá tiền, ngày đặt, ngày giao, nhân viên phụ trách, ghi chú).
   - Phân tích chi tiết công nợ: Ai đang nợ, nợ bao nhiêu tiền, ngày nào, ai nợ nhiều nhất, nợ lâu nhất.
   - Báo cáo đơn hàng và doanh số: Đếm đơn theo ngày/tháng, tính tổng doanh thu, lợi nhuận, thống kê theo nhân viên.
   - Tồn kho và kho hàng: Tồn kho gạo ST25, các đợt nhập/xuất kho.
2. Tự động tìm kiếm, đối chiếu và tính toán chính xác số liệu từ dữ liệu thật. Không bao giờ nói chung chung hay bịa đặt.
3. Khi được yêu cầu soạn tin nhắn (nhắc nợ, báo giá, tri ân), tự động lấy đúng tên khách, đúng số tiền nợ, và đính kèm thông tin thanh toán chuyển khoản:
   🏦 Ngân hàng: ${context.bankInfo.bank}
   💳 Số tài khoản: ${context.bankInfo.accountNo}
   👤 Chủ tài khoản: ${context.bankInfo.accountName}
4. Trả lời bằng tiếng Việt thân thiện, rõ ràng, gãy gọn, có cấu trúc gạch đầu dòng và định dạng số tiền VNĐ dễ đọc.

========================================================================
TOÀN BỘ DỮ LIỆU THỜI GIAN THỰC CỦA DỰ ÁN CRM VỊ NGUYÊN FOOD:
========================================================================

[1. TỔNG QUAN DOANH NGHIỆP]:
- Tổng số khách hàng trong CRM: ${context.overview.totalCustomers} khách.
- Tổng số khách đang nợ (chưa thanh toán): ${context.overview.totalUnpaidCount} khách.
- Tổng số tiền công nợ đang tồn đọng: ${context.overview.totalDebtAmount.toLocaleString('vi-VN')} đ.
- Tổng doanh số từ các đơn đã thu tiền: ${context.overview.totalPaidRevenue.toLocaleString('vi-VN')} đ.

[2. DANH SÁCH CHI TIẾT 100% KHÁCH HÀNG & ĐƠN HÀNG (${context.customers.length} BẢN GHI)]:
${JSON.stringify(context.customers, null, 1)}

[3. DANH SÁCH SẢN PHẨM & GIÁ BÁN TRONG KHO]:
${JSON.stringify(context.products, null, 1)}

[4. CÁC COMBO KHUYẾN MÃI]:
${JSON.stringify(context.combos, null, 1)}

[5. DANH SÁCH TÀI KHOẢN NHÂN VIÊN CRM]:
${JSON.stringify(context.users, null, 1)}

[6. SỔ THU CHI DÒNG TIỀN GẦN NHẤT]:
${JSON.stringify(context.recentExpenses, null, 1)}
`;
  }

  /**
   * Lấy danh sách các model Gemini khả dụng
   */
  private async getCandidateModels(apiKey: string): Promise<string[]> {
    const priorityList = [
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ];

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const available: string[] = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace(/^models\//, ''))
          .filter(
            (name: string) =>
              !name.includes('tts') &&
              !name.includes('image') &&
              !name.includes('transcribe') &&
              !name.includes('embedding') &&
              !name.includes('robotics') &&
              !name.includes('computer-use') &&
              name !== 'gemini-2.5-flash' &&
              name !== 'gemini-2.0-flash' &&
              name !== 'gemini-1.5-flash',
          );

        const matched = priorityList.filter((p) => available.includes(p));
        if (matched.length > 0) {
          return Array.from(new Set([...matched, ...available]));
        }
        if (available.length > 0) return available;
      }
    } catch (e: any) {
      this.logger.warn(`Could not list Gemini models: ${e.message}`);
    }

    return priorityList;
  }

  /**
   * Gọi Google Gemini REST API với 100% dữ liệu toàn dự án
   */
  private async callGeminiApi(apiKey: string, dto: ChatDto, context: any): Promise<string> {
    const candidateModels = await this.getCandidateModels(apiKey);
    const systemPrompt = this.buildSystemPrompt(context);

    const contents: any[] = [];
    if (dto.history && Array.isArray(dto.history)) {
      for (const h of dto.history.slice(-8)) {
        contents.push({
          role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: dto.message }],
    });

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2500,
      },
    };

    let lastError: any = null;

    for (const model of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      this.logger.log(`Attempting Gemini API with model: ${model}`);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) {
          const errText = await res.text();
          this.logger.warn(`Model ${model} failed HTTP ${res.status}: ${errText}`);
          lastError = new Error(`Gemini API HTTP ${res.status} (${model}): ${errText}`);
          continue;
        }

        const data: any = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;
        if (text) {
          this.logger.log(`Successfully generated response using model: ${model}`);
          return text.trim();
        }
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Network error with model ${model}: ${err.message}`);
      }
    }

    throw lastError || new Error('Không thể kết nối tới mô hình Gemini');
  }
}
