import {
  Body,
  Controller,
  ParseArrayPipe,
  ParseIntPipe,
  Put,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FoodTransformInterceptor } from './interceptors/food-transform.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FoodOrderService } from './food-order.service';
import { FoodOrderDTO } from './dtos/food-order.dto';

@Controller('food-order')
export class FoodOrderController {
  constructor(private readonly foodOrderService: FoodOrderService) {}

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(new FoodTransformInterceptor())
  async changeFoodOrders(
    @Req() req,
    @Res() res: Response,
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Body('foodList', new ParseArrayPipe({ items: FoodOrderDTO }))
    foodList: FoodOrderDTO[],
  ) {
    const { user } = req;
    await this.foodOrderService.changeFoodOrders(foodList, sessionId, user);
    return res.status(200).json({
      status: 'success',
      message: 'Submit food order successfully',
    });
  }
}
