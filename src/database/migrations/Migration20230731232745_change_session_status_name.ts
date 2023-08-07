import { Migration } from '@mikro-orm/migrations';

export class Migration20230731232745_change_session_status_name extends Migration {
  async up(): Promise<void> {
    this.addSql(
      "ALTER TABLE `session` modify `status` enum ('OPEN','LOCKED','PENDINGPAYMENTS','FINISHED') NOT NULL;",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "ALTER TABLE `session` modify `status` enum ('OPEN','LOCKED','PENDING PAYMENTS','FINISHED') NOT NULL;",
    );
  }
}
