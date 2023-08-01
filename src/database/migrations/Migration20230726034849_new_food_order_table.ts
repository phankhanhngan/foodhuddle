import { Migration } from '@mikro-orm/migrations';

export class Migration20230726034849_new_food_order_table extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `CREATE TABLE food_order (
        id INT unsigned NOT NULL auto_increment PRIMARY KEY,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        session_id INT unsigned NOT NULL,
        user_id INT unsigned NOT NULL,
        food_name VARCHAR(255) NOT NULL,
        origin_price INT NOT NULL,
        options VARCHAR(255) NULL,
        quantity INT NOT NULL,
        note VARCHAR(255) NULL,
        actual_price INT NULL
        ) DEFAULT CHAR
      
      SET utf8mb4 engine = InnoDB;
      `,
    );
    this.addSql(
      `ALTER TABLE food_order ADD INDEX food_order_session_id_index (session_id);`,
    );
    this.addSql(
      `ALTER TABLE food_order ADD INDEX food_order_user_id_index (user_id);`,
    );
    this.addSql(
      `ALTER TABLE food_order ADD UNIQUE food_order_session_id_user_id_food_name_unique (
        session_id,
        user_id,
        food_name
        );
      `,
    );

    this.addSql(
      `ALTER TABLE food_order 
      ADD CONSTRAINT food_order_session_id_foreign 
      FOREIGN KEY (session_id) REFERENCES session (id) 
      ON UPDATE CASCADE;
      `,
    );
    this.addSql(
      `ALTER TABLE food_order 
      ADD CONSTRAINT food_order_user_id_foreign 
      FOREIGN KEY (user_id) REFERENCES user (id)
      ON UPDATE CASCADE;
      `,
    );
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS food_order;`);
  }
}
