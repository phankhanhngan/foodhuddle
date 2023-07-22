import { Strategy } from 'passport-jwt';
import { JWTAuthConfig } from '../../../config/auth.config';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../../../entities/user.entity';
import { IUserPayLoad } from '../interfaces/user-jwt-payload.interface';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly em: EntityManager,
    private readonly userRepository: EntityRepository<User>,
  ) {
    super(JWTAuthConfig);
    this.userRepository = this.em.getRepository(User);
  }

  async validate(payload: IUserPayLoad): Promise<IUserPayLoad> {
    const { googleId, email } = payload;
    const user = await this.userRepository.findOne({
      googleId,
    });

    if (!user) throw new UnauthorizedException('Please log in to continue');

    return {
      googleId,
      email,
    };
  }
}
