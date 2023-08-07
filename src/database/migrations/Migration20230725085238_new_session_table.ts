import { Migration } from '@mikro-orm/migrations';

export class Migration20230725085238_new_session_table extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE TABLE session (
      id INT unsigned NOT NULL auto_increment PRIMARY KEY
      ,created_at DATETIME NOT NULL
      ,updated_at DATETIME NOT NULL
      ,title VARCHAR(255) NOT NULL
      ,description TEXT NULL
      ,shop_link TEXT NOT NULL
      ,host_payment_info TEXT NOT NULL
      ,qr_images TEXT NULL
      ,STATUS enum('OPEN', 'LOCKED', 'PENDING PAYMENTS', 'FINISHED') NOT NULL
      ) DEFAULT CHAR
    
    SET utf8mb4 engine = InnoDB;`);
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `session`;');
  }
}
