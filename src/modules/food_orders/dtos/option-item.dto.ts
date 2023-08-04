import { IsString, IsInt } from 'class-validator';

export class OptionItemDTO {
  @IsString({ message: 'Option name must be a string' })
  name: string;

  @IsInt({ message: 'Max quantity must be an integer' })
  maxQuantity: number;

  @IsInt({ message: 'Option price must be an integer' })
  price: number;
}
