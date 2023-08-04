import { OptionDTO } from './index';

export class OptionListDTO {
  mandatory!: boolean;
  id!: number;
  category!: string;
  minSelection!: number;
  maxSelection!: number;
  detail: OptionDTO[];
}
