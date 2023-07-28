import {
  IsInt,
  IsArray,
  ValidateIf,
  ArrayMinSize,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { OptionItemDTO } from './index';

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
  @ValidateIf((value) => Array.isArray(value) && value.length > 0)
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, {
    message: 'Food option must be null or at least have one item',
  })
  @Type(() => OptionItemDTO)
  options: OptionItemDTO[];

  @Expose()
  @IsInt({ message: 'Actual Price must be an integer' })
  actualPrice: number;

  @Expose()
  @IsInt({ message: 'Origin Price must be an integer' })
  originPrice: number;
}
