import { Migration } from '@mikro-orm/migrations';

export class Migration20230731070336_new_user_payment_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `CREATE TABLE user_payment (
        id INT unsigned NOT NULL auto_increment PRIMARY KEY
        ,created_at DATETIME NOT NULL
        ,updated_at DATETIME NOT NULL
        ,session_id INT unsigned NOT NULL
        ,user_id INT unsigned NOT NULL
        ,evidence TEXT NULL
        ,note VARCHAR(255) NULL
        ,status enum('PENDING', 'REJECTED', 'APPROVED') NOT NULL
        ) DEFAULT CHAR
      
      SET utf8mb4 engine = InnoDB;
      `,
    );
    this.addSql(
      `ALTER TABLE user_payment ADD INDEX user_payment_session_id_index (session_id);
      `,
    );
    this.addSql(
      `ALTER TABLE user_payment ADD INDEX user_payment_user_id_index (user_id);
      `,
    );
    this.addSql(
      `ALTER TABLE user_payment ADD UNIQUE user_payment_session_id_user_id_unique (
        session_id
        ,user_id
        );
      `,
    );

    this.addSql(
      `ALTER TABLE user_payment ADD CONSTRAINT user_payment_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) 
      ON UPDATE CASCADE;
      `,
    );
    this.addSql(
      `ALTER TABLE user_payment ADD CONSTRAINT user_payment_user_id_foreign 
      FOREIGN KEY (user_id) REFERENCES user (id) 
      ON UPDATE CASCADE;
      `,
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS user_payment;`);
  }
}
