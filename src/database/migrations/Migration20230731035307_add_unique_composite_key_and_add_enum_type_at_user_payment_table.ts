import { Migration } from '@mikro-orm/migrations';

export class Migration20230731035307_add_unique_composite_key_and_add_enum_type_at_user_payment_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE user_payment ADD UNIQUE user_payment_session_id_user_id_unique (
        session_id
        ,user_id
        );`,
    );
    this.addSql(
      `ALTER TABLE user_payment modify status enum (
        'PENDING'
        ,'APPROVED'
        ,'REJECTED'
        )
      `,
    );
  }

  async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE user_payment
      DROP INDEX user_payment_session_id_user_id_unique;
      `,
    );
    this.addSql(`ALTER TABLE user_payment modify STATUS VARCHAR(255)
    `);
  }
}
