import { Exclude, Expose, Transform } from 'class-transformer';
import { SessionStatus } from 'src/entities';

@Exclude()
export class SessionInfoDTO {
  host_payment_info: string;

  qr_images: string;

  shop_link: string;

  @Expose()
  @Transform(({ obj }) => obj.host.name)
  host: string;

  @Expose()
  date: Date;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: SessionStatus;

  @Expose()
  @Transform(({ obj }) => obj.shop_link)
  shopLink: string;

  @Expose()
  @Transform(({ obj }) => obj.host_payment_info)
  hostPaymentInfo: string;

  @Expose()
  @Transform(({ obj }) => JSON.parse(obj.qr_images))
  qrImages: string;
}
