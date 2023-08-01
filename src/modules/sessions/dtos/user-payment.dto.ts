import { Exclude, Expose, Transform } from 'class-transformer';
import { UserPaymentStatus } from 'src/entities';

@Exclude()
export class UserPaymentDTO {
  @Expose()
  id?: number;

  @Expose()
  @Transform(
    ({ obj, key }) => {
      if (obj[key]) {
        return {
          googleId: obj[key].googleId,
          email: obj[key].email,
          name: obj[key].name,
          photo: obj[key].photo,
        };
      }
    },
    { toClassOnly: true },
  )
  user: any;

  @Expose()
  @Transform(({ value }) => value || UserPaymentStatus.PENDING, {
    toClassOnly: true,
  })
  status: UserPaymentStatus;

  @Expose()
  note?: string;

  @Expose()
  @Transform(
    ({ obj }) => {
      if (obj.evidence) {
        return JSON.parse(obj.evidence);
      }
    },
    {
      toClassOnly: true,
    },
  )
  evidence?: string;
}
