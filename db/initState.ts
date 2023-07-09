import getKnexInstance from 'db/utils/getKnexInstance';
import { script } from 'db/script';
import { CartStatus } from 'src/cart';
import { OrderStatus } from 'src/order';

const initDBStateUp = async (): Promise<void> => {
  const { PG_CARTS_TABLE, PG_CART_ITEMS_TABLE, PG_ORDERS_TABLE, PG_USERS_TABLE } = process.env;
  const knex = getKnexInstance();

  const CARTS_TABLE_EXISTS = await knex.schema.hasTable(PG_CARTS_TABLE);
  const CART_ITEMS_TABLE_EXISTS = await knex.schema.hasTable(PG_CART_ITEMS_TABLE);
  const ORDERS_TABLE_EXISTS = await knex.schema.hasTable(PG_ORDERS_TABLE);
  const USERS_TABLE_EXISTS = await knex.schema.hasTable(PG_USERS_TABLE);

  if (!CARTS_TABLE_EXISTS) {
    await knex.schema.createTable(PG_CARTS_TABLE, (table) => {
      table.uuid('id').primary().unique().notNullable();
      table.uuid('user_id').notNullable();
      table.date('created_at').notNullable();
      table.date('updated_at').notNullable();
      table.enum('status', Object.values(CartStatus));
    });
  }

  if (!CART_ITEMS_TABLE_EXISTS) {
    await knex.schema.createTable(PG_CART_ITEMS_TABLE, (table) => {
      table.uuid('id').primary().unique().notNullable();
      table
        .uuid('cart_id')
        .notNullable()
        .references('id')
        .inTable(PG_CARTS_TABLE)
        .onDelete('CASCADE');
      table.uuid('product_id').notNullable();
      table.integer('count');
    });
  }

  if (!ORDERS_TABLE_EXISTS) {
    await knex.schema.createTable(PG_ORDERS_TABLE, (table) => {
      table.uuid('id').primary().unique().notNullable();
      table.uuid('user_id').notNullable();
      table
        .uuid('cart_id')
        .notNullable()
        .references('id')
        .inTable(PG_CARTS_TABLE);
      table.jsonb('payment');
      table.jsonb('delivery');
      table.text('comments');
      table.enum('status', Object.values(OrderStatus));
      table.integer('total');
    });
  }

  if (!USERS_TABLE_EXISTS) {
    await knex.schema.createTable(PG_USERS_TABLE, (table) => {
      table.uuid('id').primary().unique().notNullable();
      table.string('name').unique();
      table.string('email');
      table.string('password');
    });
  }
};

script(initDBStateUp);
