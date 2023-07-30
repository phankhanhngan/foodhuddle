import { Migration } from '@mikro-orm/migrations';

export class Migration20230730160523_change_option_column_type_in_food_order_table extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table `food_order` modify `options` text;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `food_order` modify `options` varchar(255);');
  }
}
