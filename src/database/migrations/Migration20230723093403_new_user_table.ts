import { Migration } from '@mikro-orm/migrations';

export class Migration20230723093403_new_user_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table `user` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `google_id` varchar(255) not null, `email` varchar(255) not null, `name` varchar(255) not null, `photo` varchar(255) null) default character set utf8mb4 engine = InnoDB;',
    );
    this.addSql(
      'alter table `user` add unique `user_google_id_unique`(`google_id`);',
    );
    this.addSql('alter table `user` add index `user_email_index`(`email`);');
    this.addSql('alter table `user` add unique `user_email_unique`(`email`);');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `user`;');
  }
}
