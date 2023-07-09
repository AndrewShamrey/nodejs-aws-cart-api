import { Controller, Get, Delete, Put, Body, Req, Post, UseGuards, HttpStatus } from '@nestjs/common';

import { BasicAuthGuard } from '../auth';
import { OrderService, Order } from '../order';
import { AppRequest, getUserIdFromRequest } from '../shared';

import { calculateCartTotal } from './models-rules';
import { CartService } from './services';
import { Cart, CartItem } from './models';

import { Knex } from 'knex';
import { wrapWithTransaction } from 'db/utils/transaction';

@Controller('api/profile/cart')
export class CartController {
  constructor(
    private cartService: CartService = new CartService(),
    private orderService: OrderService = new OrderService()
  ) { }

  @UseGuards(BasicAuthGuard)
  @Get()
  async findUserCart(@Req() req: AppRequest) {
    try {
      console.log('Start GET Cart by userId', req);
      const userId = getUserIdFromRequest(req);
      const cart = await this.cartService.findOrCreateByUserId(userId);
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { cart, total: calculateCartTotal(cart) },
      }  
    } catch (error) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: error.message,
      }
    }
  }

  @UseGuards(BasicAuthGuard)
  @Put()
  async updateUserCart(@Req() req: AppRequest, @Body() body: CartItem) {
    try {
      console.log('Start UPDATE Cart by userId', req);
      const userId = getUserIdFromRequest(req);
      const item: CartItem = await this.cartService.updateByUserId(userId, body)
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { item }
      }   
    } catch (error) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: error.message,
      }
    }
  }

  @UseGuards(BasicAuthGuard)
  @Put('replace')
  async replaceUserCart(@Req() req: AppRequest, @Body() body: Omit<Cart, 'id'>) {
    try {
      console.log('Start REPLACE Cart by userId', req);
      const userId = getUserIdFromRequest(req);
      const cart = await this.cartService.replaceByUserId(userId, body)
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: {
          cart,
          total: calculateCartTotal(cart),
        }
      }   
    } catch (error) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: error.message,
      }
    }
  }

  @UseGuards(BasicAuthGuard)
  @Delete()
  async clearUserCart(@Req() req: AppRequest) {
    try {
      console.log('Start DELETE Cart by userId', req);
      const userId = getUserIdFromRequest(req);
      await this.cartService.removeByUserId(userId);
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
      }
    } catch (error) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: error.message,
      }
    }
  }

  @UseGuards(BasicAuthGuard)
  @Post('checkout')
  async checkout(@Req() req: AppRequest, @Body() body: Pick<Order, 'payment' | 'delivery' | 'comments'>) {
    try {
      console.log('Start CHECKOUT Cart by userId', req);
      const userId = getUserIdFromRequest(req);
      const cart = await this.cartService.findByUserId(userId);
  
      if (!(cart && cart.items.length)) {
        const statusCode = HttpStatus.BAD_REQUEST;
        req.statusCode = statusCode;
  
        return {
          statusCode,
          message: 'Cart is empty',
        }
      }  

      const handler = async (trx: Knex.Transaction, orderData: Order): Promise<Order> => {
        const order = await this.orderService.create(trx, orderData);
        await this.cartService.checkoutByUserId(trx, orderData.userId);
        return order;
      };
  
      const { id: cartId, items } = cart;
      const total = calculateCartTotal(cart);
  
      const orderData: Omit<Order, 'id' | 'status'> = {
        ...body,
        userId,
        cartId,
        items,
        total,
      };

      const order = await wrapWithTransaction(handler, orderData);

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { order }
      }
    } catch (error) {
      const statusCode = HttpStatus.BAD_REQUEST;
      req.statusCode = statusCode;

      return {
        statusCode,
        message: error.message,
      }
    }
  }
}
