import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FoodOrderController } from './food-order.controller';
import { FoodOrderService } from './food-order.service';
import { FoodOrder, Session } from 'src/entities';
import { MenuShopUtil } from 'src/utils/menu-food.util';

@Module({
  imports: [MikroOrmModule.forFeature([FoodOrder, Session])],
  controllers: [FoodOrderController],
  providers: [FoodOrderService, MenuShopUtil],
})
export class FoodOrderModule {}
