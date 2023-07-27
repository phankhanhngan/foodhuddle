import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { MenuShopUtil } from 'src/util/menu-food.util';

@Module({
  imports: [MikroOrmModule.forFeature([Session])],
  controllers: [SessionController],
  providers: [SessionService, MenuShopUtil],
})
export class SessionModule {}
