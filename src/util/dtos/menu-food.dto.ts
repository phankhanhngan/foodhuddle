import { Property } from '@mikro-orm/core';

export class CrapeMenuFood {
  @Property({ nullable: false, type: 'text' })
  shop_link: string;
}
