import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { SessionService } from './session.service';
import { WinstonModule } from 'nest-winston';
import { ImageResize } from 'src/helpers/resize-images';
import { AWSModule } from '../aws/aws.module';
import { FoodOrder, SessionPayment, User, UserPayment } from 'src/entities';
import { EntityRepository } from '@mikro-orm/mysql';

@Module({
  imports: [
    AWSModule,
    WinstonModule,
    MikroOrmModule.forFeature([
      Session,
      SessionPayment,
      UserPayment,
      FoodOrder,
      User,
    ]),
  ],
  controllers: [SessionController],
  providers: [SessionService, EntityRepository, ImageResize],
})
export class SessionModule {}
