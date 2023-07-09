import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';
import { AuthService } from '../auth.service';
import { UsersService, User } from 'src/users';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService = new AuthService(new UsersService(), new JwtService())) {
    super();
  }

  async validate(username: string, pass: string): Promise<any> {
    try {
      console.log({ username }, 'START User validation (Basic Strategy)');
      const user: User = await this.authService.validateUser(username, pass); // TODO - validate password
      if (!user) throw new UnauthorizedException();

      const { password, ...result } = user;
  
      return result;
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
