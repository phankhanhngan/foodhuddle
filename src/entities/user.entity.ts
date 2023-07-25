import { Entity, Index, Property, Unique, OneToMany, Collection  } from '@mikro-orm/core';
import { Base } from './base.entity';
import { Session } from './session.entity';

@Entity()
export class User extends Base {
  @Unique()
  @Property({ nullable: false })
  googleId!: string;

  @Unique()
  @Index()
  @Property({ nullable: false })
  email!: string;

  @Property({ nullable: false })
  name: string;

  @Property({ nullable: true })
  photo?: string;

  @OneToMany (() => Session, (session) => session.host)
  sessions = new Collection<Session>(this);
}
