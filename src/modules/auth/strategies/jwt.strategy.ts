import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IAuthPayload } from '../interfaces/auth-jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { User } from 'src/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('PRIVATE_KEY'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: IAuthPayload): Promise<IAuthPayload> {
    const { email } = payload;
    const user: User = await this.authService.findUserByEmail(email);

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return user;
  }
}
