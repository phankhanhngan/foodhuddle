import {
  IsInt,
  IsArray,
  ValidateIf,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { OptionDTO } from './option-dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class CreateFoodOrderDTO {
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDTO)
  options: OptionDTO[];

  @Expose()
  sessionId: number;

  @Expose()
  @IsOptional()
  actualPrice: number;
}
