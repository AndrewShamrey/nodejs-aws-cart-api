import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { Knex } from 'knex';
import getKnexInstance from 'db/utils/getKnexInstance';
import { wrapWithTransaction } from 'db/utils/transaction';
import { mapRequiredField } from 'src/shared';
import { User } from '../models';

@Injectable()
export class UsersService {
  async findOne(userId: string): Promise<User> {
    const { PG_USERS_TABLE } = process.env;
    const knex = getKnexInstance();

    try {
      const userQuery = knex(PG_USERS_TABLE)
        .select<User[]>('*')
        .where({ id: userId });
      console.log({ sql: userQuery.toSQL() });

      const [user] = await userQuery.then((v) => v);
      console.log({ user }, 'User was received from db');

      if (!user) throw new Error('User with this userId does not exists');

      return user;
    } catch (error) {
      console.error({ userId, error }, 'Get User by userId failed');
      throw error;
    } finally {
      await knex.destroy();
    }
  }

  async findByUserName(name: string): Promise<User> {
    const { PG_USERS_TABLE } = process.env;
    const knex = getKnexInstance();

    try {
      const userQuery = knex(PG_USERS_TABLE)
        .select<User[]>('*')
        .where({ name });
      console.log({ sql: userQuery.toSQL() });

      const [user] = await userQuery.then((v) => v);
      console.log({ user }, 'User was received from db');

      if (!user) console.log('User with this username does not exists');

      return user;
    } catch (error) {
      console.error({ name, error }, 'Get User by username failed');
      throw error;
    } finally {
      await knex.destroy();
    }
  }

  async createOne(userDetails: Omit<User, 'id'>): Promise<User> {
    const { PG_USERS_TABLE } = process.env;

    const handler = async (trx: Knex.Transaction, user: User): Promise<void> => {
      const createCartQuery = trx(PG_USERS_TABLE).insert(user);
      await createCartQuery.then((v) => v);
    };

    const id = v4();
    const { name, email, password } = userDetails;
    const newUser: User = { id, name, email, password };
    mapRequiredField(newUser, 'password', password);

    await wrapWithTransaction(handler, newUser);
    console.log('User was successfully created in db');

    return newUser;
  }
}
