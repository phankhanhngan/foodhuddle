import { Migration } from '@mikro-orm/migrations';

export class Migration20230725085310_add_constrain_for_session_and_user_table extends Migration {
  async up(): Promise<void> {
    this.addSql('ALTER TABLE `session` ADD `host_id` INT unsigned NOT NULL;');
    this.addSql(
      `
      ALTER TABLE session ADD CONSTRAINT session_host_id_foreign FOREIGN KEY (host_id) REFERENCES user (id) ON

      UPDATE CASCADE;
      `,
    );
    this.addSql(
      'ALTER TABLE `session` ADD INDEX `session_host_id_index` (`host_id`);',
    );
  }

  async down(): Promise<void> {
    this.addSql(
      'ALTER TABLE `session`DROP FOREIGN KEY `session_host_id_foreign`;',
    );

    this.addSql('ALTER TABLE `session`DROP INDEX `session_host_id_index`;');
    this.addSql('ALTER TABLE `session`DROP `host_id`;');
  }
}
