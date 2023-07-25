import { Migration } from '@mikro-orm/migrations';

export class Migration20230725070820 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `session` drop foreign key `session_host_id_id_foreign`;');

    this.addSql('alter table `session` drop index `session_host_id_id_index`;');
    this.addSql('alter table `session` change `host_id_id` `host_id` int unsigned not null;');
    this.addSql('alter table `session` add constraint `session_host_id_foreign` foreign key (`host_id`) references `user` (`id`) on update cascade;');
    this.addSql('alter table `session` add index `session_host_id_index`(`host_id`);');
  }

  async down(): Promise<void> {
    this.addSql('alter table `session` drop foreign key `session_host_id_foreign`;');

    this.addSql('alter table `session` drop index `session_host_id_index`;');
    this.addSql('alter table `session` change `host_id` `host_id_id` int unsigned not null;');
    this.addSql('alter table `session` add constraint `session_host_id_id_foreign` foreign key (`host_id_id`) references `user` (`id`) on update cascade;');
    this.addSql('alter table `session` add index `session_host_id_id_index`(`host_id_id`);');
  }

}
