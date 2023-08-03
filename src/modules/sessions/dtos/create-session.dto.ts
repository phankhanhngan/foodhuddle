import { IsString, IsOptional } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class CreateSession {
  @Expose()
  @IsString({
    message: 'Title of session must be a string',
  })
  title: string;

  @Expose()
  @IsOptional()
  description: string;

  @Expose()
  @IsString({
    message: 'Shop link must be a string',
  })
  shop_link: string;

  @Expose()
  @IsString({
    message: 'Host payment infor must be a string',
  })
  host_payment_info: string;

  @Expose()
  @IsOptional()
  qr_images: string;
}
