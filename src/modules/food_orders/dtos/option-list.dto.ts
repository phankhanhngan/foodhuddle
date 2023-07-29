import { OptionDTO } from './index';

export class OptionListDTO {
  mandatory!: boolean;
  id!: number;
  category!: string;
  detail: OptionDTO[];
}
