import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import {
  RequestFoodTransformInterceptor,
  ResponseFoodTransformInterceptor,
} from './interceptors';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FoodOrderService } from './food-order.service';
import { FoodDTO, FoodOrderDTO, UpdateFoodOrderDTO } from './dtos/index';
import { FoodOrder } from 'src/entities';
import { RolesGuard } from '../auth/guards/roles.guard';
import { plainToClass } from 'class-transformer';

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
      console.log(err);
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
      console.log(err);
      throw err;
    }
  }

  @Get('menu')
  async getFoodMenu(
    @Query('sessionId', ParseIntPipe) sessionId: number,
  ): Promise<FoodDTO[]> {
    try {
      return await this.foodOrderService.getFoodMenu(sessionId);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  async updateFoodOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Body(new ValidationPipe()) foodOrder: UpdateFoodOrderDTO,
    @Res() res: Response,
  ) {
    try {
      await this.foodOrderService.updateFoodOrder(
        id,
        sessionId,
        plainToClass(UpdateFoodOrderDTO, foodOrder),
      );

      res.status(200).json({
        status: 'success',
        message: 'Submit food order successfully',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async deleteFoodOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Res() res: Response,
  ) {
    try {
      await this.foodOrderService.deleteFoodOrder(id, sessionId);

      res.status(200).json({
        status: 'success',
        message: 'Delete food order successfully',
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
