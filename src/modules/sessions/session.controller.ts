import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
  Inject,
  Body,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
  Put,
  Req,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToClass, plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SessionInfoDTO, SessionPaymentDTO } from './dtos/';
import { fileFilter } from './helpers/file-filter.helper';
import { SessionPayment, SessionStatus } from 'src/entities';
import {
  SessionStatusGuard,
  JwtAuthGuard,
  RolesGuard,
} from 'src/common/guards';

@UseGuards(JwtAuthGuard)
@Controller('session')
export class SessionController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly sessionService: SessionService,
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

  @Get(':id/payment')
  async getSessionpayment(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const sessionPayment: SessionPayment =
        await this.sessionService.getSessionPayment(id);

      res.status(200).json({
        status: 'success',
        message: 'Get session payment detail successfully',
        data: plainToClass(SessionPaymentDTO, sessionPayment, {
          enableCircularCheck: true,
        }),
      });
    } catch (err) {
      this.logger.error('Calling getSession()', err, SessionService.name);
      throw err;
    }
  }

  @Put(':id/payment')
  @UseGuards(RolesGuard)
  @UseGuards(SessionStatusGuard([SessionStatus.OPEN, SessionStatus.LOCKED]))
  @UseInterceptors(FilesInterceptor('receiptScreenshot', 5, fileFilter))
  async submitSessionPayment(
    @Res() res: Response,
    @Req() req,
    @Param('id', ParseIntPipe) sessionId: number,
    @Body(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    body: SessionPaymentDTO,
    @UploadedFiles() receiptScreenshot: Array<Express.Multer.File>,
  ) {
    try {
      const { session } = req;
      await this.sessionService.submitSessionPayment(
        session,
        receiptScreenshot,
        body,
      );
      return res.status(200).json({
        status: 'success',
        message: 'Submit session payment successfully',
      });
    } catch (err) {
      this.logger.error(
        'Calling submitSessionPayment()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }
}
