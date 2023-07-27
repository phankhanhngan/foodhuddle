import { Migration } from '@mikro-orm/migrations';

export class Migration20230725085207_new_user_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `CREATE TABLE user (
        id INT unsigned NOT NULL auto_increment PRIMARY KEY,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        google_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        photo VARCHAR(255) NULL
        ) DEFAULT CHAR
      
      SET utf8mb4 engine = InnoDB;
      `,
    );
    this.addSql(
      `ALTER TABLE user ADD UNIQUE user_google_id_unique (google_id);`,
    );
    this.addSql(`ALTER TABLE user ADD INDEX user_email_index (email);`);
    this.addSql(`ALTER TABLE user ADD UNIQUE user_email_unique (email);`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS user;`);
  }
}
