import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { SessionService } from './session.service';
import { AwsService } from '../aws/aws.service';
import { WinstonModule } from 'nest-winston';
import { ImageResize } from 'src/helpers/resize-images';
import { AWSModule } from '../aws/aws.module';
import { SessionPayment, UserPayment } from 'src/entities';
import { EntityRepository } from '@mikro-orm/mysql';

@Module({
  imports: [
    AWSModule,
    MikroOrmModule.forFeature([Session, SessionPayment, UserPayment]),
  ],
  controllers: [SessionController],
  providers: [SessionService, EntityRepository, AwsService, ImageResize],
})
export class SessionModule {}
