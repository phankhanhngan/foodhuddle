import { Entity, ManyToOne, Property, Unique } from '@mikro-orm/core';
import { Base, Session, User } from './index';
import { Transform } from 'class-transformer';

@Entity()
@Unique({ properties: ['session', 'user', 'foodName'] })
export class FoodOrder extends Base {
  @ManyToOne({ entity: () => Session })
  session!: Session;

  @ManyToOne({ entity: () => User })
  user!: User;

  @Property({ nullable: false })
  foodName!: string;

  @Property({ nullable: false })
  originPrice!: number;

  @Property({ nullable: true, type: 'text' })
  @Transform(
    ({ value, key, obj }) => {
      obj[key] = JSON.stringify(value);
      return obj[key];
    },
    {
      toClassOnly: true,
    },
  )
  options?: string;

  @Property({ nullable: false })
  quantity!: number;

  @Property({ nullable: true })
  note?: string;

  @Property({ nullable: true })
  actualPrice?: number;
}
