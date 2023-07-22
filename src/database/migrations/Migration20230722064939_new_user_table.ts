import { Migration } from '@mikro-orm/migrations';

export class Migration20230722064939_new_user_table extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `user` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `google_id` varchar(255) not null, `email` varchar(255) not null, `name` varchar(255) not null) default character set utf8mb4 engine = InnoDB;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `user`;');
  }

}
