import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { AWSModule } from '../aws/aws.module';
import { SessionService } from './session.service';
import { SessionPayment } from 'src/entities';
import { EntityRepository } from '@mikro-orm/mysql';
import { ImageResize } from 'src/helpers/resize-images';
import { ShopInfo } from 'src/utils/shop-info.util';

@Module({
  imports: [AWSModule, MikroOrmModule.forFeature([Session, SessionPayment])],
  controllers: [SessionController],
  providers: [SessionService, EntityRepository, ImageResize, ShopInfo],
})
export class SessionModule {}
