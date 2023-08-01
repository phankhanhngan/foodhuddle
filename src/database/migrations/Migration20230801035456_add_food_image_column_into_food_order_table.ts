import { Migration } from '@mikro-orm/migrations';

export class Migration20230801035456_add_food_image_column_into_food_order_table extends Migration {
  async up(): Promise<void> {
    this.addSql('ALTER TABLE `food_order` ADD `food_image` text null;');
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE `food_order` DROP `food_image`;');
  }
}
