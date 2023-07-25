import { Entity, Enum, Index, Property, Unique } from '@mikro-orm/core';
import { Base } from './base.entity';

@Unique()
@Entity()
export class Session extends Base {

  @Property({ nullable: false })
  host_id: number;

  @Property({ nullable: false })
  title: string;

  @Property({ nullable: true, type: 'text' })
  description: string;

  @Property({ nullable: false, type: 'text' })
  shop_link: string;

  @Property({ nullable: false, type: 'text' })
  host_payment_infor: string

  @Property({ nullable: true, type: 'text' })
  qr_image: string;

  @Enum(()  => SessionStatus)
  status!: SessionStatus;

}

export enum SessionStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  FINISHED = 'FINISHED',
}