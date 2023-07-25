import { Migration } from '@mikro-orm/migrations';

export class Migration20230725070537 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `session` drop foreign key `session_user_id_foreign`;');

    this.addSql('alter table `session` drop index `session_user_id_index`;');
    this.addSql('alter table `session` drop `host_id`;');
    this.addSql('alter table `session` change `user_id` `host_id_id` int unsigned not null;');
    this.addSql('alter table `session` add constraint `session_host_id_id_foreign` foreign key (`host_id_id`) references `user` (`id`) on update cascade;');
    this.addSql('alter table `session` add index `session_host_id_id_index`(`host_id_id`);');
  }

  async down(): Promise<void> {
    this.addSql('alter table `session` drop foreign key `session_host_id_id_foreign`;');

    this.addSql('alter table `session` add `host_id` int not null;');
    this.addSql('alter table `session` drop index `session_host_id_id_index`;');
    this.addSql('alter table `session` change `host_id_id` `user_id` int unsigned not null;');
    this.addSql('alter table `session` add constraint `session_user_id_foreign` foreign key (`user_id`) references `user` (`id`) on update cascade;');
    this.addSql('alter table `session` add index `session_user_id_index`(`user_id`);');
  }

}
