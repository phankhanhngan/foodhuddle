import { Migration } from '@mikro-orm/migrations';

export class Migration20230725085310 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `session` add `host_id` int unsigned not null;');
    this.addSql('alter table `session` add constraint `session_host_id_foreign` foreign key (`host_id`) references `user` (`id`) on update cascade;');
    this.addSql('alter table `session` add index `session_host_id_index`(`host_id`);');
  }

  async down(): Promise<void> {
    this.addSql('alter table `session` drop foreign key `session_host_id_foreign`;');

    this.addSql('alter table `session` drop index `session_host_id_index`;');
    this.addSql('alter table `session` drop `host_id`;');
  }

}
