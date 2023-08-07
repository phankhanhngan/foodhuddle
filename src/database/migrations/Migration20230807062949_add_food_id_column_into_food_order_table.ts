import { Migration } from '@mikro-orm/migrations';

export class Migration20230807062949_add_food_id_column_into_food_order_table extends Migration {
  async up(): Promise<void> {
    this.addSql('ALTER TABLE `food_order` ADD `food_id` INT NOT NULL;');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE `food_order` DROP `food_id`;');
  }
}
