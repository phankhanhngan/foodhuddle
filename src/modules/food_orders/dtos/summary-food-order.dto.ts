import { Exclude, Expose, Transform } from 'class-transformer';
import { OptionDTO } from './index';

@Exclude()
export class SummaryFoodOrderDTO {
  @Expose()
  id: number;

  @Expose()
  @Transform(({ obj, key }) => {
    return {
      googleId: obj[key].googleId,
      email: obj[key].email,
      name: obj[key].name,
      photo: obj[key].photo,
    };
  })
  user: object;

  @Expose()
  foodName: string;

  @Expose()
  foodImage: string | null;

  @Expose()
  originPrice: number;

  @Expose()
  quantity: number;

  @Expose()
  note?: string;

  @Expose()
  @Transform(({ obj, key }) => (obj[key] = JSON.parse(obj[key])))
  options: OptionDTO[];

  @Expose()
  actualPrice: number;
}
