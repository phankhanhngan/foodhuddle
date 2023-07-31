import { Entity, ManyToOne, Property, Enum, Unique } from '@mikro-orm/core';
import { Base } from './base.entity';
import { Session } from './session.entity';
import { User } from './user.entity';

@Entity()
@Unique({ properties: ['session', 'user'] })
export class UserPayment extends Base {
  @ManyToOne({ entity: () => Session })
  session!: Session;

  @ManyToOne({ entity: () => User })
  user!: User;

  @Property({ nullable: true })
  evidence?: string;

  @Property({ nullable: false })
  finalPayment: number;

  @Property({ nullable: true })
  note?: string;

  @Property({ nullable: false })
  @Enum(() => UserPaymentStatus)
  status: UserPaymentStatus;
}

export enum UserPaymentStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
}
