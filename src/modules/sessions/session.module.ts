import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { WinstonModule } from 'nest-winston';
import { FoodOrder } from 'src/entities';

@Module({
  imports: [MikroOrmModule.forFeature([Session, FoodOrder]), WinstonModule],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
