import { Migration } from '@mikro-orm/migrations';

export class Migration20230731232745_change_session_status_name extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table `session` add `shop_name` text null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `session` drop `shop_name`;');
  }
}
