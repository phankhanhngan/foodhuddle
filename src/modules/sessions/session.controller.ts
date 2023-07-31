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
  ParseEnumPipe,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToClass, plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SessionInfoDTO, SessionPaymentDTO, UserPaymentDTO } from './dtos/';
import { fileFilter } from './helpers/file-filter.helper';
import { SessionPayment, SessionStatus, UserPayment } from 'src/entities';
import {
  SessionStatusGuard,
  JwtAuthGuard,
  RolesGuard,
} from 'src/common/guards';
import { UserPaymentAction } from './enums/user-payment-action.enum';

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
    @UploadedFiles()
    receiptScreenshot: Array<Express.Multer.File> | Express.Multer.File,
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

  @UseGuards(SessionStatusGuard([SessionStatus.PENDING_PAYMENTS]))
  @UseInterceptors(FilesInterceptor('evidence', 5, fileFilter))
  @Put(':id/user-payment')
  async submitUserPayment(
    @Body(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    body: UserPaymentDTO,
    @UploadedFiles() evidence: Array<Express.Multer.File> | Express.Multer.File,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      const { session, user } = req;
      await this.sessionService.submitUserPayment(
        body,
        session,
        evidence,
        user,
      );
      res.status(200).json({
        status: 'success',
        message: 'Submit user request payment successfully',
      });
    } catch (err) {
      this.logger.error(
        'Calling submitUserPayment()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  @Get(':id/user-payment')
  @UseGuards(
    SessionStatusGuard([
      SessionStatus.PENDING_PAYMENTS,
      SessionStatus.FINISHED,
    ]),
  )
  async getUserpayment(
    @Res() res: Response,
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const { session, user } = req;
      const userPayment: UserPayment = await this.sessionService.getUserPayment(
        session,
        user,
      );

      res.status(200).json({
        status: 'success',
        message: 'Get user request payment detail successfully',
        data: plainToInstance(UserPaymentDTO, userPayment, {
          enableCircularCheck: true,
        }),
      });
    } catch (err) {
      this.logger.error('Calling getSession()', err, SessionService.name);
      throw err;
    }
  }

  @Put(':id/user-payment/:userPaymentId/change-status')
  @UseGuards(RolesGuard)
  @UseGuards(SessionStatusGuard([SessionStatus.PENDING_PAYMENTS]))
  async changeUserPaymentStatus(
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
    @Param('userPaymentId', ParseIntPipe) userPaymentId: number,
    @Body('action', new ParseEnumPipe(UserPaymentAction))
    action: UserPaymentAction,
  ) {
    try {
      await this.sessionService.changeUserPaymentStatus(userPaymentId, action);
      res.status(200).json({
        status: 'success',
        message: `${action} user request payment successfully`,
      });
    } catch (err) {
      this.logger.error(
        'Calling changeUserPaymentStatus()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  @Put(':id/user-payment/approve-all')
  @UseGuards(RolesGuard)
  @UseGuards(SessionStatusGuard([SessionStatus.PENDING_PAYMENTS]))
  async approveAllUserPayment(
    @Req() req,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const { session } = req;
      await this.sessionService.approveAllUserPayment(session);
      res.status(200).json({
        status: 'success',
        message: `APPROVE ALL user request payments successfully`,
      });
    } catch (err) {
      this.logger.error(
        'Calling changeUserPaymentStatus()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  @Get(':id/payment-checklist')
  @UseGuards(RolesGuard)
  @UseGuards(SessionStatusGuard([SessionStatus.PENDING_PAYMENTS]))
  async getPaymentChecklist(
    @Req() req,
    @Res() res: Response,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      const { session } = req;
      const paymentChecklist = await this.sessionService.getPaymentChecklist(
        session,
      );
      res.status(200).json({
        status: 'success',
        message: `Get payment checklist successfully`,
        data: paymentChecklist,
      });
    } catch (err) {
      this.logger.error(
        'Calling changeUserPaymentStatus()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }
}
