import { Migration } from '@mikro-orm/migrations';

export class Migration20230731160835_change_receipt_screenshot_column_type_at_session_payment_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE session_payment MODIFY receipt_screenshot TEXT not null;`,
    );
  }

  async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE session_payment MODIFY receipt_screenshot VARCHAR(255) not null;`,
    );
  }
}
