import { OptionItemDTO } from './index';

export class OptionListDTO {
  mandatory!: boolean;
  id!: number;
  name!: string;
  optionItems: OptionItemDTO[];
}
