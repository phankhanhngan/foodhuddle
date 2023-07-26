import {
  Body,
  Controller,
  Get,
  ParseArrayPipe,
  ParseIntPipe,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import {
  RequestFoodTransformInterceptor,
  ResponseFoodTransformInterceptor,
} from './interceptors';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FoodOrderService } from './food-order.service';
import { FoodOrderDTO } from './dtos/food-order.dto';
import { FoodOrder } from 'src/entities';

@UseGuards(JwtAuthGuard)
@Controller('food-order')
export class FoodOrderController {
  constructor(private readonly foodOrderService: FoodOrderService) {}

  @Put()
  @UseInterceptors(new RequestFoodTransformInterceptor())
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
      message: 'Submit food orders successfully',
    });
  }

  @Get()
  @UseInterceptors(new ResponseFoodTransformInterceptor())
  async getFoodOrders(
    @Query('sessionId', ParseIntPipe) sessionId: number,
    @Req() req,
  ): Promise<FoodOrder[]> {
    const { user } = req;
    return await this.foodOrderService.getFoodOrdersByUser(user, sessionId);
  }
}
