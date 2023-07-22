import { Entity, Property } from '@mikro-orm/core';
import { Base } from './base.entity';

@Entity()
export class User extends Base {
  constructor(googleId: string, email: string, name: string) {
    super();
    this.googleId = googleId;
    this.email = email;
    this.name = name;
  }
  @Property({ nullable: false })
  googleId: string;

  @Property({ nullable: false })
  email: string;

  @Property({ nullable: false })
  name: string;
}
