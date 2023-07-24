import { Entity, Index, Property, Unique } from '@mikro-orm/core';
import { Base } from './base.entity';

@Entity()
export class Session extends Base {

  @Index()
  @Property({ nullable: false })
  hostId: number;

  @Property({ nullable: false })
  title: string;

  @Property({ nullable: true })
  description: Text;

  @Property({ nullable: false })
  deadline: Date;

  @Property({ nullable: false })
  shopLink: string;

  @Property({ nullable: true })
  qrImage: string;

  @Property({ nullable: true })
  hostPaymentInfo: string;

  @Property({ nullable: false })
  status: Enumerator;


}
