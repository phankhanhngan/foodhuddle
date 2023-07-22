import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { IUserPayLoad } from './interfaces/user-jwt-payload.interface';
import { UserAuthenDTO } from './dtos/user-authen.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly em: EntityManager,
    private readonly userRepository: EntityRepository<User>,
  ) {
    this.userRepository = this.em.getRepository(User);
  }

  generateJwt(payload: IUserPayLoad): string {
    return this.jwtService.sign(payload);
  }

  async logIn(user: UserAuthenDTO): Promise<string> {
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
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ email });
  }

  async register(user: UserAuthenDTO): Promise<string> {
    const { googleId, email, name } = user;
    const newUser: User = new User(googleId, email, name);

    this.em.persistAndFlush(newUser);
    return this.generateJwt({
      googleId: newUser.googleId,
      email: newUser.email,
    });
  }
}
