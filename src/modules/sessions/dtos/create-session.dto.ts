import { Enum, Property } from '@mikro-orm/core';

export class CreateSession {
  @Property({ nullable: false })
  host: number;

  @Property({ nullable: false })
  title: string;

  @Property({ nullable: true, type: 'text' })
  description: string;

  @Property({ nullable: false, type: 'text' })
  shop_link: string;

  @Property({ nullable: false, type: 'text' })
  host_payment_info: string;

  @Property({ nullable: true, type: 'text' })
  qr_images: string;

  @Enum(() => SessionStatusA)
  status!: SessionStatusA;
}

export enum SessionStatusA {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  PENDING_PAYMENTS = 'PENDING PAYMENTS',
  FINISHED = 'FINISHED',
}
