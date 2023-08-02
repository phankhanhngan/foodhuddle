import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Inject,
  ParseArrayPipe,
  ParseIntPipe,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  ParseEnumPipe,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  RequestFoodTransformInterceptor,
  ResponseFoodTransformInterceptor,
} from './interceptors';
import { FoodOrderService } from './food-order.service';
import { CreateFoodOrderDTO, UpdateFoodOrderDTO } from './dtos/index';
import { FoodOrder, SessionStatus } from 'src/entities';
import { plainToClass } from 'class-transformer';
import { GroupedBy } from './enums/grouped-by.enum';
import {
  SessionStatusGuard,
  JwtAuthGuard,
  RolesGuard,
} from 'src/common/guards';

@UseGuards(JwtAuthGuard)
@Controller('food-order')
export class FoodOrderController {
  constructor(
    private readonly foodOrderService: FoodOrderService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Put()
  @UseGuards(SessionStatusGuard([SessionStatus.OPEN, SessionStatus.LOCKED]))
  @UseInterceptors(new RequestFoodTransformInterceptor())
  async changeFoodOrders(
    @Req() req,
    @Res() res: Response,
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Body('foodOrderList', new ParseArrayPipe({ items: CreateFoodOrderDTO }))
    foodOrderList: CreateFoodOrderDTO[],
  ) {
    try {
      const { user, session } = req;

      if (
        session.status === SessionStatus.LOCKED &&
        user.id !== session.host.id
      ) {
        throw new BadRequestException(
          `Can not perform this action because Session is in status '${session.status}'`,
        );
      }

      await this.foodOrderService.changeFoodOrders(
        foodOrderList,
        user,
        session,
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

  @Get('menu')
  async getFoodMenu(
    @Query('sessionId', ParseIntPipe) sessionId: number,
    @Res() res: Response,
  ) {
    try {
      const foodMenu = await this.foodOrderService.getFoodMenu(sessionId);
      res.status(200).json({
        status: 'success',
        message: 'Get food menu successfully',
        data: foodMenu,
      });
    } catch (err) {
      this.logger.error('Calling getFoodMenu()', err, FoodOrderController.name);
      throw err;
    }
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @UseGuards(SessionStatusGuard([SessionStatus.OPEN, SessionStatus.LOCKED]))
  async updateFoodOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Body(new ValidationPipe()) foodOrder: UpdateFoodOrderDTO,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      const { session } = req;
      await this.foodOrderService.updateFoodOrder(
        id,
        session,
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
  @UseGuards(SessionStatusGuard([SessionStatus.OPEN, SessionStatus.LOCKED]))
  async deleteFoodOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Res() res: Response,
    @Req() req,
  ) {
    try {
      const { session } = req;
      await this.foodOrderService.deleteFoodOrder(id, session);

      res.status(200).json({
        status: 'success',
        message: 'Delete food order successfully',
      });
    } catch (err) {
      this.logger.error(
        'Calling deleteFoodOrder()',
        err,
        FoodOrderController.name,
      );
      throw err;
    }
  }

  @Get('/summary')
  async getSummaryFoodOrders(
    @Res() res: Response,
    @Query('sessionId', ParseIntPipe) sessionId: number,
    @Query('groupedBy', new ParseEnumPipe(GroupedBy))
    groupedBy: GroupedBy,
  ) {
    try {
      const response = await this.foodOrderService.getSummaryFoodOrders(
        sessionId,
        groupedBy,
      );
      res.status(200).json({
        status: 'success',
        message: 'Get food order summary successfully',
        data: {
          sessionId,
          foodOrderList: response,
        },
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
