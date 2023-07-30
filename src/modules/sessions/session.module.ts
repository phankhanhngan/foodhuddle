import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { AWSModule } from '../aws/aws.module';
import { SessionPayment } from 'src/entities';
import { EntityRepository } from '@mikro-orm/mysql';

@Module({
  imports: [AWSModule, MikroOrmModule.forFeature([Session, SessionPayment])],
  controllers: [SessionController],
  providers: [SessionService, EntityRepository],
})
export class SessionModule {}
