import { Migration } from '@mikro-orm/migrations';

export class Migration20230730160523_change_option_column_type_in_food_order_table extends Migration {
  async up(): Promise<void> {
    this.addSql('ALTER TABLE `food_order` modify `options` TEXT;');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE `food_order` modify `options` VARCHAR(255);');
  }
}
