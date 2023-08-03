import { Entity, ManyToOne, Property, Enum, Unique } from '@mikro-orm/core';
import { Base } from './base.entity';
import { Session } from './session.entity';
import { User } from './user.entity';

@Entity()
@Unique({ properties: ['session', 'user'] })
export class UserPayment extends Base {
  @ManyToOne({
    entity: () => Session,
    onDelete: 'cascade',
    onUpdateIntegrity: 'cascade',
  })
  session!: Session;

  @ManyToOne({ entity: () => User })
  user!: User;

  @Property({ nullable: true, type: 'text' })
  evidence?: string;

  @Property({ nullable: true })
  note?: string;

  @Enum({ items: () => UserPaymentStatus, nullable: false })
  status: UserPaymentStatus;
}

export enum UserPaymentStatus {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
}
