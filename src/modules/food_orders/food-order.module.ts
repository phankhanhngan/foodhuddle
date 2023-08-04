import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FoodOrderController } from './food-order.controller';
import { FoodOrderService } from './food-order.service';
import {
  FoodOrder,
  Session,
  SessionPayment,
  User,
  UserPayment,
} from 'src/entities';
import { MenuShopUtil } from 'src/utils/menu-food.util';
import { AuthModule } from '../auth/auth.module';
import { SessionService } from '../sessions/session.service';
import { AWSModule } from '../aws/aws.module';
import { ShopInfo } from 'src/utils/shop-info.util';

@Module({
  imports: [
    AuthModule,
    MikroOrmModule.forFeature([
      FoodOrder,
      Session,
      SessionPayment,
      UserPayment,
      User,
    ]),
    AWSModule,
  ],
  controllers: [FoodOrderController],
  providers: [FoodOrderService, SessionService, MenuShopUtil, ShopInfo],
})
export class FoodOrderModule {}
