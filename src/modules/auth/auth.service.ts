import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities';
import { IAuthPayload, IUserAuthen } from './interfaces/index';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
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
      console.log('HAS AN ERROR AT GENERATE JWT SERVICE', err);
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
      console.log('HAS AN ERROR AT LOGIN SERVICE', err);
      throw err;
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
      console.log('HAS AN ERROR AT REGISTER SERVICE', err);
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      return await this.userRepository.findOne({ email });
    } catch (err) {
      console.log('HAS AN ERROR AT FIND USER BY EMAIL SERVICE', err);
      throw new InternalServerErrorException();
    }
  }
}
