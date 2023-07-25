import { Entity, Enum, Index, Property, Unique } from '@mikro-orm/core';
import { Base } from './base.entity';

@Unique()
@Entity()
export class Session extends Base {

  @Property({ nullable: false })
  hostId: number;

  @Property({ nullable: false })
  title: string;

  @Property({ nullable: true, type: 'text' })
  description: string;

  @Property({ nullable: false, type: 'text' })
  shopLink: string;

  @Property({ nullable: false, type: 'text' })
  hostPaymentInfor: string

  @Property({ nullable: true, type: 'text' })
  qrImage: string;

  @Enum(()  => SessionStatus)
  status!: SessionStatus;

}

export enum SessionStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  FINISHED = 'FINISHED',
}