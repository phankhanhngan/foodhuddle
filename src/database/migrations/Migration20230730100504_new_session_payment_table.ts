import { Migration } from '@mikro-orm/migrations';

export class Migration20230730100504_new_session_payment_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `CREATE TABLE session_payment (
        id INT unsigned NOT NULL auto_increment PRIMARY KEY
        ,created_at DATETIME NOT NULL
        ,updated_at DATETIME NOT NULL
        ,session_id INT unsigned NOT NULL
        ,shipping_fee INT NULL
        ,other_fee INT NULL
        ,discount_amount INT NULL
        ,receipt_screenshot VARCHAR(255) NOT NULL
        ) DEFAULT CHAR
      
      SET utf8mb4 engine = InnoDB;`,
    );
    this.addSql(
      `ALTER TABLE session_payment ADD UNIQUE session_payment_session_id_unique (session_id);
      `,
    );

    this.addSql(
      `ALTER TABLE session_payment ADD CONSTRAINT session_payment_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) 
      ON UPDATE CASCADE;
      `,
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS session_payment;`);
  }
}
