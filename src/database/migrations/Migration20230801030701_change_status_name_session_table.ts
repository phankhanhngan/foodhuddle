import { Migration } from '@mikro-orm/migrations';

export class Migration20230801030701_change_status_name_session_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      "alter table `session` modify `status` enum('OPEN', 'LOCKED', 'PENDING PAYMENTS', 'FINISHED') not null;",
    );
  }

  async down(): Promise<void> {
    this.addSql(
      "alter table `session` modify `status` enum('OPEN', 'LOCKED', 'PENDINGPAYMENTS', 'FINISHED') not null;",
    );
  }
}
