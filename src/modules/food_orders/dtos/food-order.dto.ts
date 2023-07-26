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
import { Type } from 'class-transformer';

export class FoodOrderDTO {
  @IsString({
    message: 'Food name must be a string',
  })
  foodName: string;

  @IsInt({ message: 'Food price must be an integer' })
  originPrice: number;

  @IsInt({ message: 'Food quantity must be an integer' })
  quantity: number;

  @ValidateIf((object, value) => value)
  @IsString({ message: 'Food note must be a string' })
  note?: string;

  @ValidateIf((object, value) => Array.isArray(value) && value.length > 0)
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1, {
    message: 'Food option must be null or at least have one item',
  })
  @Type(() => OptionDTO)
  options: OptionDTO[];

  @IsOptional()
  sessionId: number;

  @IsOptional()
  userId: number;

  @IsOptional()
  actualPrice: number;
}
