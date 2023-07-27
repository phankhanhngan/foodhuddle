import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { plainToInstance } from 'class-transformer';
import { SessionInfoDTO } from './dtos/session-info.dto';
@UseGuards(JwtAuthGuard)
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('/today')
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

  @Get(':id')
  async getSession(@Param('id', ParseIntPipe) id: number) {
    try {
      const session = await this.sessionService.getSession(id);

      return plainToInstance(SessionInfoDTO, session, {
        enableCircularCheck: true,
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
