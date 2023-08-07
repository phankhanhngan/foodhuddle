import { Migration } from '@mikro-orm/migrations';

export class Migration20230803074114_change_status_name_session_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      "ALTER TABLE `session` modify `status` enum ('OPEN','LOCKED','PENDING PAYMENTS','FINISHED') NOT NULL;",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "ALTER TABLE `session` modify `status` enum ('OPEN','LOCKED','PENDINGPAYMENTS','FINISHED') NOT NULL;",
    );
  }
}
