import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { SessionService } from './session.service';
import { AWSService } from '../aws/aws.service';
import { WinstonModule } from 'nest-winston';
import { FoodOrder } from 'src/entities';
import { ShopImage } from 'src/utils/shop-image.util';

@Module({
  imports: [MikroOrmModule.forFeature([Session, FoodOrder]), WinstonModule],
  controllers: [SessionController],
  providers: [SessionService, AWSService, ShopImage],
})
export class SessionModule {}
