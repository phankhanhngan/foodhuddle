import {
  IsInt,
  IsArray,
  ValidateIf,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { OptionDTO } from './index';

@Exclude()
export class UpdateFoodOrderDTO {
  @Expose()
  @IsString({
    message: 'Food name must be a string',
  })
  foodName: string;

  @Expose()
  @IsInt({ message: 'Food quantity must be an integer' })
  quantity: number;

  @Expose()
  @ValidateIf((value) => value)
  @IsString({ message: 'Food note must be a string' })
  note?: string;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDTO)
  options: OptionDTO[];

  @Expose()
  @IsInt({ message: 'Actual Price must be an integer' })
  actualPrice: number;

  @Expose()
  @IsInt({ message: 'Origin Price must be an integer' })
  originPrice: number;
}
