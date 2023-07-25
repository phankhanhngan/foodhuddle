import {
  Controller,
  Get,
  Param,
  HttpStatus,
  Res 
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) { }

  @Get('/today')
  async getAllSessionsToday(
    @Res() res: Response) {

    const allSessionToday = await (this.sessionService.getAllSessionsToday());

    return res.status(HttpStatus.OK).json({
      status: "success",
      data: allSessionToday
    });
  }

}