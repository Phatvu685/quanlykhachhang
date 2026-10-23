import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSocialAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Nền tảng (resource) không được để trống' })
  resource: string; // vd: "Zalo", "Facebook"...

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
