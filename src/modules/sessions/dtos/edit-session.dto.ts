import { IsString, IsOptional } from 'class-validator';
import { SessionStatus } from 'src/entities/session.entity';

export class EditSession {
  @IsString({
    message: 'Title of session must be a string',
  })
  title: string;

  @IsOptional()
  description: string;

  @IsString({
    message: 'Shop link must be a string',
  })
  shop_link: string;

  @IsString({
    message: 'Host payment infor must be a string',
  })
  host_payment_info: string;

  @IsOptional()
  qr_images: string;

  status: SessionStatus.OPEN | SessionStatus.LOCKED;
}
