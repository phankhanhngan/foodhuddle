import { Migration } from '@mikro-orm/migrations';

export class Migration20230725034220_new_session_table extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `session` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `host_id` varchar(255) not null, `title` varchar(255) not null, `description` text null, `shop_link` text not null, `host_payment_infor` text not null, `qr_image` text null, `status` enum(\'OPEN\', \'LOCKED\', \'FINISHED\') not null) default character set utf8mb4 engine = InnoDB;');
  }
  
  async down(): Promise<void> {
    this.addSql('drop table if exists `session`;');
  }

}
