// ============================================================================
// AuthModule: đăng ký JwtModule (cấu hình secret/thời hạn token), PassportModule,
// JwtStrategy, cùng Controller/Service xử lý đăng nhập.
// ============================================================================
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule, // để AuthService inject được UsersService
    PassportModule, // hạ tầng chung cho các strategy (jwt, local...)

    // registerAsync: cấu hình JwtModule "muộn" (sau khi ConfigModule đã đọc xong .env),
    // thay vì hardcode secret trực tiếp trong code.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret';
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '12h';

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: jwtExpiresIn as '12h',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
