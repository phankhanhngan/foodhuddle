import { Migration } from '@mikro-orm/migrations';

export class Migration20230802044003_add_shop_image_to_session_table extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table `session` add `shop_image` text null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `session` drop `shop_image`;');
  }
}
