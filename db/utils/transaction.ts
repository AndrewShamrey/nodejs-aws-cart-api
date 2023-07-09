import { Knex } from 'knex';
import getKnexInstance from 'db/utils/getKnexInstance';

const wrapWithTransaction = async <T, R>(
  handler: (
    trx: Knex.Transaction,
    ...rest: T[]
  ) => Promise<R>,
  ...rest: T[]
): Promise<R> => {
  const knex = getKnexInstance();
  let trx: Knex.Transaction;

  try {
    trx = await knex.transaction();
    const record = await handler(trx, ...rest);

    await trx.commit();

    return record;
  } catch (error) {
    const { message } = error;

    await trx?.rollback(error);

    console.error({ message }, 'Transaction is now rolled back');

    if (!String(error['message']).includes('duplicate key value')) {
      throw error;
    }

    throw new Error('Item with same id already exists');
  } finally {
    await knex.destroy();
  }
};

export { wrapWithTransaction };
