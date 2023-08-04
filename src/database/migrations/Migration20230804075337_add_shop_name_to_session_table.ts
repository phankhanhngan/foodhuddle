import { Migration } from '@mikro-orm/migrations';

export class Migration20230804075337_add_shop_name_to_session_table extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table `session` add `shop_name` text null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `session` drop `shop_name`;');
  }
}
