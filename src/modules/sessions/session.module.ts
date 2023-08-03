import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { SessionService } from './session.service';
import { FoodOrder, SessionPayment, User, UserPayment } from 'src/entities';
import { AWSService } from '../aws/aws.service';
import { WinstonModule } from 'nest-winston';
import { ImageResize } from 'src/helpers/resize-images';
import { AWSModule } from '../aws/aws.module';
import { EntityRepository } from '@mikro-orm/mysql';
import { ShopImage } from 'src/utils/shop-image.util';

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
  providers: [
    SessionService,
    EntityRepository,
    AWSService,
    ImageResize,
    ShopImage,
    AWSService,
    ImageResize,
    ShopImage,
    EntityRepository,
  ],
})
export class SessionModule {}
