import { Entity, Enum, Property, Unique, ManyToOne } from '@mikro-orm/core';
import { Base } from './base.entity';
import { User } from './user.entity';

@Unique()
@Entity()
export class Session extends Base {
  @ManyToOne(() => User)
  host!: User;

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

  @Property({ nullable: true, type: 'text' })
  shop_image: string;

  @Property({ nullable: true, type: 'text' })
  shop_name: string;

  @Enum(() => SessionStatus)
  status!: SessionStatus;
}

export enum SessionStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  PENDING_PAYMENTS = 'PENDING PAYMENTS',
  FINISHED = 'FINISHED',
}
