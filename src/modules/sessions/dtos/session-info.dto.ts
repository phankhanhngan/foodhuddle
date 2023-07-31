import { Exclude, Expose, Transform } from 'class-transformer';
import { SessionStatus } from 'src/entities';

@Exclude()
export class SessionInfoDTO {
  host_payment_info: string;

  qr_images: string;

  shop_link: string;

  created_at: Date;

  @Expose()
  @Transform(({ obj }) => obj.host.name)
  host: string;

  @Transform(({ obj }) =>
    new Date(obj.created_at).toLocaleDateString('en-GB', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }),
  )
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
  @Transform(({ obj }) => {
    if (obj.qr_images) {
      return JSON.parse(obj.qr_images);
    }
    return null;
  })
  qrImages: string;
}
