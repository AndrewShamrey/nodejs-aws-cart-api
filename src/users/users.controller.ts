import { Controller, Get, Post, Req, Body, Param, HttpStatus } from '@nestjs/common';
import { validate } from 'uuid';

import { AppRequest } from '../shared';
import { UsersService } from './services';
import { User } from './models';

// ! There are endpoints just for test integration with User Service
@Controller('api/profile/user')
export class UsersController {
  constructor(
    private usersService: UsersService = new UsersService()
  ) { }

  @Get(':id')
  async findUserById(@Req() req: AppRequest, @Param() params: any) {
    try {
      console.log('Start GET User by id', req);
      const userId = params.id;
      const isValid = validate(userId); 
      if (!isValid) throw new Error('Invalid data format! User ID should be a valid uuid');

      const user: User = await this.usersService.findOne(userId);
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { user },
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

  @Get('/byName/:name')
  async findUserByName(@Req() req: AppRequest, @Param() params: any) {
    try {
      console.log('Start GET User by username', req);
      const username = params.name;
      const user: User = await this.usersService.findByUserName(username);

      if (!user) {
        const statusCode = HttpStatus.NOT_FOUND;
        req.statusCode = statusCode;

        return {
          statusCode,
          message: 'User with this username does not exists',
        }
      }
  
      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { user },
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

  @Post()
  async createUser(@Req() req: AppRequest, @Body() body: Omit<User, 'id'>) {
    try {
      console.log('Start CREATE User', req);
      const user: User = await this.usersService.createOne(body);

      return {
        statusCode: HttpStatus.OK,
        message: 'OK',
        data: { user }
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
