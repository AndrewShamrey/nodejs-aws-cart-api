import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import { Knex } from 'knex';
import getKnexInstance from 'db/utils/getKnexInstance';
import { mapRequiredField } from 'src/shared';
import { Order, OrderStatus } from '../models';

@Injectable()
export class OrderService {
  private orders: Record<string, Order> = {}

  async findById(orderId: string): Promise<Order> {
    const { PG_ORDERS_TABLE, PG_CART_ITEMS_TABLE, PG_PRODUCTS_TABLE } = process.env;
    const knex = getKnexInstance();

    try {
      const orderQuery = knex(PG_ORDERS_TABLE)
        .join(PG_CART_ITEMS_TABLE, `${PG_ORDERS_TABLE}.cart_id`, `${PG_CART_ITEMS_TABLE}.cart_id`)
        .join(PG_PRODUCTS_TABLE, `${PG_PRODUCTS_TABLE}.id`, `${PG_CART_ITEMS_TABLE}.product_id`)
        .first<Order>(
          knex.raw(`
          "${PG_ORDERS_TABLE}".id, 
          "${PG_ORDERS_TABLE}".user_id as userId, 
          "${PG_ORDERS_TABLE}".cart_id as cartId, 
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
          ) as items,
          "${PG_ORDERS_TABLE}".payment, 
          "${PG_ORDERS_TABLE}".delivery, 
          "${PG_ORDERS_TABLE}".comments, 
          "${PG_ORDERS_TABLE}".status, 
          "${PG_ORDERS_TABLE}".total`)
        )
        .where({ [`${PG_ORDERS_TABLE}.id`]: orderId })
        .groupBy(`${PG_ORDERS_TABLE}.id`);

      console.log({ sql: orderQuery.toSQL() });

      const order = await orderQuery.then((v) => v);
      console.log({ order }, 'Order was received from db');

      return order;
    } catch (error) {
      console.error({ orderId, error }, 'Get Order by id failed');
      throw error;
    } finally {
      await knex.destroy();
    }
  }

  async findOrders(): Promise<Order[]> {
    const { PG_ORDERS_TABLE, PG_CART_ITEMS_TABLE, PG_PRODUCTS_TABLE } = process.env;
    const knex = getKnexInstance();

    try {
      const orderQuery = knex(PG_ORDERS_TABLE)
        .join(PG_CART_ITEMS_TABLE, `${PG_ORDERS_TABLE}.cart_id`, `${PG_CART_ITEMS_TABLE}.cart_id`)
        .join(PG_PRODUCTS_TABLE, `${PG_PRODUCTS_TABLE}.id`, `${PG_CART_ITEMS_TABLE}.product_id`)
        .select<Order[]>(
          knex.raw(`
          "${PG_ORDERS_TABLE}".id, 
          "${PG_ORDERS_TABLE}".user_id as userId, 
          "${PG_ORDERS_TABLE}".cart_id as cartId, 
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
          ) as items,
          "${PG_ORDERS_TABLE}".payment, 
          "${PG_ORDERS_TABLE}".delivery, 
          "${PG_ORDERS_TABLE}".comments, 
          "${PG_ORDERS_TABLE}".status, 
          "${PG_ORDERS_TABLE}".total`)
        )
        .groupBy(`${PG_ORDERS_TABLE}.id`);

      console.log({ sql: orderQuery.toSQL() });

      const orders = await orderQuery.then((v) => v);
      console.log({ orders }, 'Orders was received from db');

      return orders;
    } catch (error) {
      console.error({ error }, 'Get Orders failed');
      throw error;
    } finally {
      await knex.destroy();
    }
  }

  async create(trx: Knex.Transaction, data: Omit<Order, 'id' | 'status'>): Promise<Order> {
    const { PG_ORDERS_TABLE } = process.env;
    const { userId, cartId, payment, delivery, comments, total, items } = data;
    const {
      type: paymentType,
      address: paymentAddress,
      creditCard,
    } = payment ?? {};
    const { type: deliveryType, address: deliveryAddress } = delivery ?? {};

    const orderPayment: Order['payment'] = {
      creditCard,
      type: paymentType,
      address: paymentAddress,
    };
    mapRequiredField(orderPayment, 'type', paymentType);

    const orderDelivery: Order['delivery'] = {
      type: deliveryType,
      address: deliveryAddress,
    };
    mapRequiredField(orderDelivery, 'type', deliveryType);
    mapRequiredField(orderDelivery, 'address', deliveryAddress);

    const order: Order = {
      id: v4(),
      userId,
      cartId,
      items,
      payment: orderPayment,
      delivery: orderDelivery,
      comments,
      status: OrderStatus.OPEN,
      total,
    };

    console.log(order, 'new Order was successfully prepared');

    const orderToCreate = {
      id: order.id,
      user_id: order.userId,
      cart_id: order.cartId,
      payment: order.payment,
      delivery: order.delivery,
      comments: order.comments,
      status: order.status,
      total: order.total,
    };

    console.log(orderToCreate, 'Order to create was prepared');

    const createOrderQuery = trx(PG_ORDERS_TABLE).insert(orderToCreate);
    await createOrderQuery.then((v) => v);

    console.log('Order was successfully created in db');

    return order;
  }

  async update(orderId: string, data) {
    const order = await this.findById(orderId);
    if (!order) throw new Error('Order does not exist.');

    this.orders[orderId] = {
      ...data,
      id: orderId,
    }
  }
}
