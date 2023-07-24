import { Body, Post, Controller, Get, Put, Param, Delete } from '@nestjs/common';
import { SessionService } from './session.service';


@Controller('sessions')
export class SessionController{
    constructor(private readonly sessionService: SessionService){}

  @Get('/today')
  getAllSessionsToday() {
    return this.sessionService.getAllSessionsToday();
  }

  @Get('/today/:id')
  getSessionsByUserID(@Param('id') id: number) {
    return this.sessionService.getSessionsByUserID(id);
  }

}