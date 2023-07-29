import { IsString, IsArray, ValidateNested } from 'class-validator';
import { OptionItemDTO } from './option-item.dto';
import { Type } from 'class-transformer';

export class OptionDTO {
  @IsString({ message: 'Option category must be a string' })
  category: string;

  @IsArray({ message: 'Option detail must be an array of Option Item' })
  @ValidateNested({ each: true })
  @Type(() => OptionItemDTO)
  detail: OptionItemDTO[];
}
