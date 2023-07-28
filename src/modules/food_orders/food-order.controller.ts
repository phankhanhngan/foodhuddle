import {
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
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
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
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
  constructor(
    private readonly foodOrderService: FoodOrderService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Put()
  @UseInterceptors(new RequestFoodTransformInterceptor())
  async changeFoodOrders(
    @Req() req,
    @Res() res: Response,
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Body('foodOrderList', new ParseArrayPipe({ items: FoodOrderDTO }))
    foodOrderList: FoodOrderDTO[],
  ) {
    try {
      const { user } = req;
      await this.foodOrderService.changeFoodOrders(
        foodOrderList,
        sessionId,
        user,
      );
      return res.status(200).json({
        status: 'success',
        message: 'Submit food orders successfully',
      });
    } catch (err) {
      this.logger.error(
        'Calling changeFoodOrders()',
        err,
        FoodOrderController.name,
      );
      throw err;
    }
  }

  @Get()
  @UseInterceptors(new ResponseFoodTransformInterceptor())
  async getFoodOrdersByUser(
    @Query('sessionId', ParseIntPipe) sessionId: number,
    @Req() req,
  ): Promise<FoodOrder[]> {
    try {
      const { user } = req;
      return await this.foodOrderService.getFoodOrdersByUser(user, sessionId);
    } catch (err) {
      this.logger.error(
        'Calling getFoodOrdersByUser()',
        err,
        FoodOrderController.name,
      );
      throw err;
    }
  }
}
