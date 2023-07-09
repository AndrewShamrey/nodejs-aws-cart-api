import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { Knex } from 'knex';
import getKnexInstance from 'db/utils/getKnexInstance';
import { wrapWithTransaction } from 'db/utils/transaction';
import { mapRequiredField } from 'src/shared';
import { Cart, CartItem, CartStatus } from '../models';

@Injectable()
export class CartService {
  async findByUserId(userId: string): Promise<Cart> {
    const { PG_CARTS_TABLE, PG_CART_ITEMS_TABLE, PG_PRODUCTS_TABLE } = process.env;
    const knex = getKnexInstance();

    try {
      const records = await knex(PG_CARTS_TABLE)
        .select('id')
        .where({ user_id: userId, status: CartStatus.OPEN })
        .then((v) => v);
      const isRecordExists = records.length;

      if (!isRecordExists) {
        console.log(records, 'Cart does not exists in table');
        return;
      }

      console.log(records, 'Cart already exists in table');

      const cartQuery = knex(PG_CARTS_TABLE)
        .join(PG_CART_ITEMS_TABLE, `${PG_CARTS_TABLE}.id`, `${PG_CART_ITEMS_TABLE}.cart_id`)
        .join(PG_PRODUCTS_TABLE, `${PG_PRODUCTS_TABLE}.id`, `${PG_CART_ITEMS_TABLE}.product_id`)
        .first<Cart>(
          knex.raw(`
          "${PG_CARTS_TABLE}".id, 
          jsonb_agg(
            json_build_object(
              'product', json_build_object(
                'id', "${PG_PRODUCTS_TABLE}".id,
                'title', "${PG_PRODUCTS_TABLE}".title,
                'description', "${PG_PRODUCTS_TABLE}".description,
                'price', "${PG_PRODUCTS_TABLE}".price
              ), 
              'count', "${PG_CART_ITEMS_TABLE}".count
            )
          ) as items`)
        )
        .where({
          [`${PG_CARTS_TABLE}.user_id`]: userId,
          [`${PG_CARTS_TABLE}.status`]: CartStatus.OPEN,
        })
        .groupBy(`${PG_CARTS_TABLE}.id`);

      console.log({ sql: cartQuery.toSQL() });

      const cart = await cartQuery.then((v) => v);

      console.log({ cart }, 'Cart was received from db');

      if (!cart) return ({
        id: records[0].id,
        items: [],
      });
  
      return cart;
    } catch (error) {
      console.error({ userId, error }, 'Get Cart by userId failed');
      throw error;
    } finally {
      await knex.destroy();
    }
  }

  async createByUserId(userId: string): Promise<Cart> {
    const { PG_CARTS_TABLE } = process.env;

    const handler = async (trx: Knex.Transaction, id: string, user_id: string): Promise<void> => {
      const date = new Date().toISOString().split('T')[0];
      const cart = {
        id,
        user_id,
        created_at: date,
        updated_at: date,
        status: CartStatus.OPEN,
      };

      const createCartQuery = trx(PG_CARTS_TABLE).insert(cart);
      await createCartQuery.then((v) => v);
    };

    const cartId = v4();

    await wrapWithTransaction(handler, cartId, userId);
    console.log('Cart was successfully created in db');

    const emptyCart: Cart = { id: cartId, items: [] };
    return emptyCart;
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const cart = 
      (await this.findByUserId(userId)) || 
      (await this.createByUserId(userId));

    return cart;
  }

  async updateByUserId(userId: string, item: CartItem): Promise<CartItem> {
    const { PG_CARTS_TABLE, PG_CART_ITEMS_TABLE } = process.env;
    const { id: cartId } = await this.findOrCreateByUserId(userId);

    const handler = async (trx: Knex.Transaction, cart_id: string, item: CartItem): Promise<void> => {
      const { product: { id: product_id } = {}, count } = item;
      const isProductExistsInCart = !!(await trx(PG_CART_ITEMS_TABLE)
        .first()
        .where({ cart_id, product_id })
        .then((v) => v));
      console.log({ isProductExistsInCart }, 'Product existing query result');

      let query: Knex.QueryBuilder;
      if (isProductExistsInCart) {
        if (count === 0) {
          query = trx(PG_CART_ITEMS_TABLE).delete().where({ cart_id, product_id });
        } else {
          query = trx(PG_CART_ITEMS_TABLE).update({ count }).where({ cart_id, product_id });
        }
      } else {
        const cartItem = {
          id: v4(),
          cart_id,
          product_id,
          count,
        };
              
        query = trx(PG_CART_ITEMS_TABLE).insert(cartItem);
      }

      await query.then((v) => v);

      const date = new Date().toISOString().split('T')[0];
      const updateCartQuery = trx(PG_CARTS_TABLE)
        .update({ updated_at: date })
        .where({ id: cart_id });

      await updateCartQuery.then((v) => v);
    };

    await wrapWithTransaction(handler, cartId, item);
    console.log('Cart Item was successfully updated in db');

    return item;
  }

  async replaceByUserId(userId: string, { items = [] }: Omit<Cart, 'id'>): Promise<Cart> {
    const { PG_CARTS_TABLE, PG_CART_ITEMS_TABLE } = process.env;
    const { id: cartId } = await this.findOrCreateByUserId(userId);

    const handler = async (trx: Knex.Transaction, cart: Cart): Promise<void> => {
      const { id: cart_id, items: cartItems } = cart;
      await trx(PG_CART_ITEMS_TABLE).delete().where({ cart_id }).then((v) => v);

      cartItems.map(async ({ product, count }) => {
        const cartItem = {
          id: v4(),
          cart_id,
          product_id: product.id, // TODO - validate not existing products
          count,
        };
        const createNewCartItemsQuery = trx(PG_CART_ITEMS_TABLE).insert(cartItem);
        await createNewCartItemsQuery.then((v) => v);
      });

      const date = new Date().toISOString().split('T')[0];
      const updateCartQuery = trx(PG_CARTS_TABLE)
        .update({ updated_at: date })
        .where({ id: cart_id });

      await updateCartQuery.then((v) => v);
    };

    const newItems: CartItem[] = items.map(({ product, count }) => {
      const { id, title, description, price } = product ?? {};

      const cartProduct: CartItem['product'] = { id, title, description, price };
      mapRequiredField(cartProduct, 'id', id);
      mapRequiredField(cartProduct, 'title', title);
      mapRequiredField(cartProduct, 'description', description);
      mapRequiredField(cartProduct, 'price', price);

      const item: CartItem = { product: cartProduct, count };
      mapRequiredField(item, 'count', count);

      return item;
    });

    const updatedCart: Cart = { id: cartId, items: newItems };

    await wrapWithTransaction(handler, updatedCart);
    console.log('Cart Items was successfully updated in db');

    return updatedCart;
  }

  async checkoutByUserId(trx: Knex.Transaction, user_id: string): Promise<void> {
    const { PG_CARTS_TABLE } = process.env;
    const date = new Date().toISOString().split('T')[0];
    const updateCartQuery = trx(PG_CARTS_TABLE)
      .update({ updated_at: date, status: CartStatus.ORDERED })
      .where({ user_id, status: CartStatus.OPEN });
    
    await updateCartQuery.then((v) => v);
    console.log('Cart was successfully ordered in db');
  }

  async removeByUserId(userId: string): Promise<void> {
    const { PG_CARTS_TABLE } = process.env;

    const handler = async (trx: Knex.Transaction, user_id: string): Promise<void> => {
      // Cart Items are deleted automatically due to the CASCADE onDelete setting
      const deleteCartQuery = trx(PG_CARTS_TABLE)
        .delete()
        .where({ user_id, status: CartStatus.OPEN });
        
      await deleteCartQuery.then((v) => v);
    };

    await wrapWithTransaction(handler, userId);
    console.log('Cart was successfully deleted in db');
  }
}
