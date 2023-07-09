import { Controller, Get, Req, Param, HttpStatus } from '@nestjs/common';
import { validate } from 'uuid';

import { AppRequest } from '../shared';
import { OrderService } from './services';
import { Order } from './models';

@Controller('api/profile/order')
export class OrderController {
  constructor(
    private orderService: OrderService = new OrderService()
  ) { }

  @Get(':orderId')
  async findOrder(@Req() req: AppRequest, @Param() params: any) {
    try {
      console.log('Start GET Order', req);
      const orderId = params.orderId;
      const isValid = validate(orderId);
      if (!isValid) throw new Error('Invalid data format! Order ID should be a valid uuid');

      const order: Order = await this.orderService.findById(orderId);
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { order },
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

  @Get()
  async getAllOrders(@Req() req: AppRequest) {
    try {
      console.log('Start GET All Orders', req);
      const orders: Order[] = await this.orderService.findOrders();
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { orders },
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
