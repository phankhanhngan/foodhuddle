import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FoodOrderController } from './food-order.controller';
import { FoodOrderService } from './food-order.service';
import { FoodOrder, Session } from 'src/entities';
import { MenuShopUtil } from 'src/utils/menu-food.util';
import { AuthModule } from '../auth/auth.module';
import { SessionService } from '../sessions/session.service';

@Module({
  imports: [AuthModule, MikroOrmModule.forFeature([FoodOrder, Session])],
  controllers: [FoodOrderController],
  providers: [FoodOrderService, SessionService, MenuShopUtil],
})
export class FoodOrderModule {}
