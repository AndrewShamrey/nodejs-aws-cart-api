import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './services';

@Module({
  providers: [ OrderService ],
  controllers: [ OrderController ],
  exports: [ OrderService ]
})
export class OrderModule {}
