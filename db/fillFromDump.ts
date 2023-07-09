import * as fs from 'fs';
import * as path from 'path';
import getKnexInstance from 'db/utils/getKnexInstance';
import { script } from 'db/script';

const fillTables = async () => {
  const knex = getKnexInstance();

  try {
    const sql = fs.readFileSync(path.resolve(process.cwd(), 'dump', `dump-${process.env.SOURCE}.sql`)).toString();
    await knex.raw(sql);
  } catch (error) {
    console.log(error);
  }
};

script(fillTables);
