import { Migration } from '@mikro-orm/migrations';

export class Migration20230726034849_new_food_order_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table `food_order` (`id` int unsigned not null auto_increment primary key, `created_at` datetime not null, `updated_at` datetime not null, `session_id` int unsigned not null, `user_id` int unsigned not null, `food_name` varchar(255) not null, `origin_price` int not null, `options` varchar(255) null, `quantity` int not null, `note` varchar(255) null, `actual_price` int null) default character set utf8mb4 engine = InnoDB;',
    );
    this.addSql(
      'alter table `food_order` add index `food_order_session_id_index`(`session_id`);',
    );
    this.addSql(
      'alter table `food_order` add index `food_order_user_id_index`(`user_id`);',
    );
    this.addSql(
      'alter table `food_order` add unique `food_order_session_id_user_id_food_name_unique`(`session_id`, `user_id`, `food_name`);',
    );

    this.addSql(
      'alter table `food_order` add constraint `food_order_session_id_foreign` foreign key (`session_id`) references `session` (`id`) on update cascade;',
    );
    this.addSql(
      'alter table `food_order` add constraint `food_order_user_id_foreign` foreign key (`user_id`) references `user` (`id`) on update cascade;',
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `food_order`;');
  }
}
