import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { FoodOrderController } from './food-order.controller';
import { FoodOrderService } from './food-order.service';
import { FoodOrder, Session, SessionPayment } from 'src/entities';
import { MenuShopUtil } from 'src/utils/menu-food.util';
import { AuthModule } from '../auth/auth.module';
import { SessionService } from '../sessions/session.service';
import { AWSModule } from '../aws/aws.module';
import { ShopImage } from 'src/utils/shop-image.util';

@Module({
  imports: [
    AuthModule,
    MikroOrmModule.forFeature([FoodOrder, Session, SessionPayment]),
    AWSModule,
  ],
  controllers: [FoodOrderController],
  providers: [FoodOrderService, SessionService, MenuShopUtil, ShopImage],
})
export class FoodOrderModule {}
