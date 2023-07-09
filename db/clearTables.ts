import { Knex } from 'knex';
import getKnexInstance from 'db/utils/getKnexInstance';
import { script } from 'db/script';

const clearTables = async (knex: Knex, tables: string[]) => {
  await Promise.allSettled(
    tables.map((db) =>
      knex(db)
        .delete()
        .returning('*')
        .then((v) => v),
    ),
  );
};

script(async () => {
  const { PG_CARTS_TABLE, PG_CART_ITEMS_TABLE, PG_ORDERS_TABLE, PG_USERS_TABLE } = process.env;
  const knex = getKnexInstance();

  const tablesToClear = [PG_CART_ITEMS_TABLE, PG_ORDERS_TABLE, PG_USERS_TABLE, PG_CARTS_TABLE];
  await clearTables(knex, tablesToClear);
});
