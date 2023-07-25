import {
  Controller,
  Get,
  Param,
  HttpStatus,
  Res,
  UseGuards
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) { }

  @Get('/get-all-sessions-today')
  @UseGuards(JwtAuthGuard)
  async getAllSessionsToday(
    @Res() res: Response) {

    try {

      const allSessionToday = await (this.sessionService.getAllSessionsToday());

      return res.status(HttpStatus.OK).json({
        status: "success",
        data: allSessionToday
      });

    } catch (error) {
      console.log('HAS AN ERROR AT GETTING ALL SESSIONS TODAY');
      throw error;
    }
  }

}