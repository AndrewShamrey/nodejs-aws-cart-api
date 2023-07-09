import knexInstance, { Knex } from 'knex';

const instances: Knex[] = [];

export const destroyAll = async (): Promise<void> => {
  await Promise.all(instances.map((v) => v.destroy()));
};

const getKnexInstance = (): Knex => {
  const isLocal = process.env.IS_LOCAL === 'true';
  const knexConnectionConfig = {
    host: isLocal ? 'localhost' : process.env.PG_HOST,
    port: Number(process.env.PG_PORT),
    user: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE,
  };

  const instance = knexInstance({
    debug: isLocal,
    client: 'pg',
    connection: knexConnectionConfig,
    pool: {
      min: 0,
      max: 10,
      acquireTimeoutMillis: 26000,
      createTimeoutMillis: 1500,
      createRetryIntervalMillis: 500,
      propagateCreateError: false,
    },
  });

  instances.push(instance);

  return instance;
};

export default getKnexInstance;
