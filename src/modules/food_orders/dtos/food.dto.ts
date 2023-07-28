import { OptionListDTO } from './index';

export class FoodDTO {
  id!: number;
  foodName!: string;
  description?: string;
  price!: number;
  discountPrice?: number;
  photo?: string;
  options: OptionListDTO[];
}
