import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { SessionService } from './session.service';
import { AwsService } from '../aws/aws.service';
import { WinstonModule } from 'nest-winston';
import { ImageResize } from 'src/helpers/resize-images';
import { ShopImage } from 'src/utils/shop-image.util';

@Module({
  imports: [MikroOrmModule.forFeature([Session]), WinstonModule],
  controllers: [SessionController],
  providers: [SessionService, AwsService, ImageResize, ShopImage],
})
export class SessionModule {}
