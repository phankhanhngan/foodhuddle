import { Migration } from '@mikro-orm/migrations';

export class Migration20230725070101 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `session` add `user_id` int unsigned not null;');
    this.addSql('alter table `session` modify `host_id` int not null, modify `status` enum(\'OPEN\', \'LOCKED\', \'PENDING PAYMENTS\', \'FINISHED\') not null;');
    this.addSql('alter table `session` add constraint `session_user_id_foreign` foreign key (`user_id`) references `user` (`id`) on update cascade;');
    this.addSql('alter table `session` add index `session_user_id_index`(`user_id`);');
  }

  async down(): Promise<void> {
    this.addSql('alter table `session` drop foreign key `session_user_id_foreign`;');

    this.addSql('alter table `session` modify `host_id` varchar(255) not null, modify `status` enum(\'OPEN\', \'LOCKED\', \'FINISHED\') not null;');
    this.addSql('alter table `session` drop index `session_user_id_index`;');
    this.addSql('alter table `session` drop `user_id`;');
  }

}
