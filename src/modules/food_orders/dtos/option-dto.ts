import { IsString, IsInt } from 'class-validator';

export class OptionDTO {
  @IsString({ message: 'Option name must be astring' })
  name: string;

  @IsInt({ message: 'Option price must be an integer' })
  price: number;
}
