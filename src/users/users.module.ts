import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services';

@Module({
  providers: [ UsersService ],
  controllers: [ UsersController ],
  exports: [ UsersService ],
})
export class UsersModule {}
