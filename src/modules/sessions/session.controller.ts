import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToInstance } from 'class-transformer';
import { SessionInfoDTO } from './dtos/session-info.dto';

@UseGuards(JwtAuthGuard)
@Controller('session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

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
      this.logger.error(
        'Calling getAllSessionsToday()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }

  @Get(':id')
  async getSession(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SessionInfoDTO> {
    try {
      const session = await this.sessionService.getSession(id);

      return plainToInstance(SessionInfoDTO, session, {
        enableCircularCheck: true,
      });
    } catch (err) {
      this.logger.error('Calling getSession()', err, SessionService.name);
      throw err;
    }
  }

  @Get('/today/hosted')
  @UseGuards(JwtAuthGuard)
  async getAllSessionHostedTodayByUserId(@Res() res: Response) {
    try {
      const userId = Object(res.req.user).id;

      const allSessionHostedTodayByUserId =
        await this.sessionService.getAllSessionHostedTodayByUserId(userId);

      return res.status(200).json({
        statusCode: 200,
        data: allSessionHostedTodayByUserId,
      });
    } catch (error) {
      this.logger.error(
        'HAS AN ERROR AT GETTING ALL SESSIONS HOSTED TODAY BY USER ID',
      );
      throw error;
    }
  }

  @Get('/today/joined')
  @UseGuards(JwtAuthGuard)
  async getAllSessionsJoinedTodayByUserId(@Res() res: Response) {
    try {
      const userId = Object(res.req.user).id;

      const allSessionsJoinedTodayByUserId =
        await this.sessionService.getAllSessionsJoinedTodayByUserId(userId);

      return res.status(200).json({
        statusCode: 200,
        data: allSessionsJoinedTodayByUserId,
      });
    } catch (error) {
      this.logger.error(
        'HAS AN ERROR AT GETTING ALL SESSIONS JOINED TODAY BY USER ID',
      );
      throw error;
    }
  }
}
