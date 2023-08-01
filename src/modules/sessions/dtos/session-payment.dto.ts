import { Exclude, Expose, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';

@Exclude()
export class SessionPaymentDTO {
  @Expose()
  @IsInt({ message: 'Discount amount must be an integer' })
  discountAmount: number;

  @Expose()
  @IsInt({ message: 'Shipping fee must be an integer' })
  shippingFee: number;

  @Expose()
  @IsInt({ message: 'Other fees must be an integer' })
  otherFee: number;

  @Expose()
  @Transform(
    ({ obj }) => {
      if (obj.receiptScreenshot) return JSON.parse(obj.receiptScreenshot);
    },
    { toClassOnly: true },
  )
  receiptScreenshot!: string;
}
