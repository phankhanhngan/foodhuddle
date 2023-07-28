import {
  IsInt,
  IsArray,
  ValidateIf,
  ArrayMinSize,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { OptionDTO } from './option-dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class FoodOrderDTO {
  @Expose()
  @IsString({
    message: 'Food name must be a string',
  })
  foodName: string;
  @Expose()
  @IsInt({ message: 'Food price must be an integer' })
  originPrice: number;

  @Expose()
  @IsInt({ message: 'Food quantity must be an integer' })
  quantity: number;

  @Expose()
  @ValidateIf((object, value) => value)
  @IsString({ message: 'Food note must be a string' })
  note?: string;

  @Expose()
  @ValidateIf((object, value) => Array.isArray(value) && value.length > 0)
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, {
    message: 'Food option must be null or at least have one item',
  })
  @Type(() => OptionDTO)
  options: OptionDTO[];

  @Expose()
  sessionId: number;

  @Expose()
  @IsOptional()
  actualPrice: number;
}
