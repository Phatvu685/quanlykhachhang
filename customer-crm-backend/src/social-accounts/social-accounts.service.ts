// ============================================================================
// SocialAccountsService: CRUD đơn giản cho tài khoản MXH dùng để chăm sóc
// khách hàng (Zalo, Facebook...). Port từ addAccount()/renderAccounts() gốc.
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

@Injectable()
export class SocialAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.socialAccount.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const acc = await this.prisma.socialAccount.findUnique({ where: { id } });
    if (!acc) throw new NotFoundException(`Không tìm thấy tài khoản id=${id}`);
    return acc;
  }

  async create(dto: CreateSocialAccountDto) {
    return this.prisma.socialAccount.create({ data: dto });
  }

  async update(id: number, dto: UpdateSocialAccountDto) {
    await this.findOne(id);
    return this.prisma.socialAccount.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.socialAccount.delete({ where: { id } });
    return { success: true };
  }
}
