import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { IAuthPayload, IUserAuthen } from './interfaces/index';
import { User } from 'src/entities';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly jwtService: JwtService,
    private readonly configservice: ConfigService,
    private readonly em: EntityManager,
    private readonly userRepository: EntityRepository<User>,
  ) {
    this.userRepository = em.getRepository(User);
  }

  generateJwt(payload: IAuthPayload): string {
    try {
      return this.jwtService.sign(payload, {
        privateKey: this.configservice.get<string>('PRIVATE_KEY'),
        expiresIn: this.configservice.get<string>('TOKEN_EXPIRE_TIME'),
      });
    } catch (err) {
      this.logger.error('Calling generateJwt()', err, AuthService.name);
      throw new InternalServerErrorException();
    }
  }

  async logIn(user: IUserAuthen): Promise<string> {
    try {
      if (!user) {
        throw new BadRequestException('Unauthenticated');
      }

      const userExists: User = await this.findUserByEmail(user.email);

      if (!userExists) {
        return this.register(user);
      }

      return this.generateJwt({
        googleId: userExists.googleId,
        email: userExists.email,
      });
    } catch (err) {
      this.logger.error('Calling logIn()', err, AuthService.name);
      throw new InternalServerErrorException();
    }
  }

  async register(user: IUserAuthen): Promise<string> {
    try {
      const { googleId, email, name, photo } = user;
      const newUser = this.userRepository.create({
        googleId,
        email,
        name,
        photo,
      });

      this.em.persistAndFlush(newUser);

      return this.generateJwt({
        googleId: newUser.googleId,
        email: newUser.email,
      });
    } catch (err) {
      this.logger.error('Calling register()', err, AuthService.name);
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      return await this.userRepository.findOne({ email });
    } catch (err) {
      this.logger.error('Calling findUserByEmail()', err, AuthService.name);
      throw new InternalServerErrorException();
    }
  }
}
