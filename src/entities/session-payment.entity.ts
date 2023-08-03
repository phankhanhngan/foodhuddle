import { Entity, Property, OneToOne } from '@mikro-orm/core';
import { Base } from './base.entity';
import { Session } from './session.entity';

@Entity()
export class SessionPayment extends Base {
  @OneToOne(() => Session, {
    onDelete: 'cascade',
    onUpdateIntegrity: 'cascade',
  })
  session!: Session;

  @Property({ nullable: true })
  shippingFee?: number;

  @Property({ nullable: true })
  otherFee?: number;

  @Property({ nullable: true })
  discountAmount?: number;

  @Property({ nullable: false, type: 'text' })
  receiptScreenshot!: string;
}
