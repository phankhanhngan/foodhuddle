import { Migration } from '@mikro-orm/migrations';

export class Migration20230803041243_adding_cascade_into_tables_related_to_session_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE session_payment DROP FOREIGN KEY session_payment_session_id_foreign;`,
    );
    this.addSql(
      `ALTER TABLE food_order DROP FOREIGN KEY food_order_session_id_foreign;`,
    );
    this.addSql(`
      ALTER TABLE user_payment DROP FOREIGN KEY user_payment_session_id_foreign;
      `);

    this.addSql(
      `ALTER TABLE session_payment ADD CONSTRAINT session_payment_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) 
      ON UPDATE CASCADE ON DELETE CASCADE;`,
    );
    this.addSql(`
      ALTER TABLE food_order ADD CONSTRAINT food_order_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) 
      ON UPDATE CASCADE ON DELETE CASCADE;`);
    this.addSql(`
      ALTER TABLE user_payment ADD CONSTRAINT user_payment_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
      `);
  }

  async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE session_payment DROP FOREIGN KEY session_payment_session_id_foreign;`,
    );
    this.addSql(`
      ALTER TABLE food_order DROP FOREIGN KEY food_order_session_id_foreign;`);
    this.addSql(`
      ALTER TABLE user_payment DROP FOREIGN KEY user_payment_session_id_foreign;
      `);

    this.addSql(
      `ALTER TABLE session_payment ADD CONSTRAINT session_payment_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) ON UPDATE CASCADE;`,
    );
    this.addSql(`
      ALTER TABLE food_order ADD CONSTRAINT food_order_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) ON UPDATE CASCADE;`);
    this.addSql(`
      ALTER TABLE user_payment ADD CONSTRAINT user_payment_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) ON UPDATE CASCADE;
      `);
  }
}
