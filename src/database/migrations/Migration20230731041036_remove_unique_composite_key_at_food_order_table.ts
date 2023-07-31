import { Migration } from '@mikro-orm/migrations';

export class Migration20230731041036_remove_unique_composite_key_at_food_order_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE food_order
      DROP INDEX food_order_session_id_user_id_food_name_unique;
      `,
    );
  }

  async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE food_order ADD UNIQUE food_order_session_id_user_id_food_name_unique (
        session_id
        ,user_id
        ,food_name
        );
      `,
    );
  }
}
