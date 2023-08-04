import { Exclude, Expose, Transform } from 'class-transformer';
import { SessionStatus } from 'src/entities';

@Exclude()
export class SessionInfoDTO {
  host_payment_info: string;

  qr_images: string;

  shop_link: string;

  created_at: Date;

  shop_image: string;

  shop_name: string;

  @Expose()
  @Transform(({ obj, key }) => ({
    googleId: obj[key].googleId,
    email: obj[key].email,
    name: obj[key].name,
    photo: obj[key].photo,
  }))
  host: object;

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
  @Transform(({ obj }) => obj.shop_name)
  shopName: string;

  @Expose()
  @Transform(({ obj }) => obj.shop_image)
  shopImage: string;

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
