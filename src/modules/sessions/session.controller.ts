import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuShopUtil } from 'src/util/menu-food.util';
import { CrapeMenuFood } from 'src/util/dtos/menu-food.dto';

@Controller('session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly menuShopUtil: MenuShopUtil,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllSessionsToday(@Res() res: Response) {
    try {
      const allSessionToday = await this.sessionService.getAllSessionsToday();

      return res.status(200).json({
        statusCode: 200,
        data: allSessionToday,
      });
    } catch (error) {
      console.log('HAS AN ERROR AT GETTING ALL SESSIONS TODAY');
      throw error;
    }
  }

  @Post('/get-menu-food')
  @UseGuards(JwtAuthGuard)
  async getMenuByShopLink(@Body() dto: CrapeMenuFood, @Res() res: Response) {
    try {
      const menuFoodByShopLink = await this.menuShopUtil.getMenuFood(
        dto.shop_link,
      );

      return res.status(200).json(menuFoodByShopLink);
    } catch (error) {
      console.log('HAS AN ERROR WHEN GETTING FOOD MENU OF SHOP');
      throw error;
    }
  }
}
