import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { SessionService } from './session.service';
import { AWSService } from '../aws/aws.service';
import { WinstonModule } from 'nest-winston';
import { AWSModule } from '../aws/aws.module';
import { SessionPayment } from 'src/entities';
import { EntityRepository } from '@mikro-orm/mysql';
import { ShopInfo } from 'src/utils/shop-info.util';

@Module({
  imports: [AWSModule, MikroOrmModule.forFeature([Session, SessionPayment])],
  controllers: [SessionController],
  providers: [SessionService, AWSService, EntityRepository, ShopInfo],
})
export class SessionModule {}
