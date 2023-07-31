import {
  Entity,
  Property,
  Unique,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { Base, Session } from './index';

@Entity()
export class User extends Base {
  @Unique()
  @Property({ nullable: false })
  googleId!: string;

  @Unique()
  @Property({ nullable: false })
  email!: string;

  @Property({ nullable: false })
  name: string;

  @Property({ nullable: true })
  photo?: string;

  @OneToMany(() => Session, (session) => session.host)
  sessions = new Collection<Session>(this);
}
