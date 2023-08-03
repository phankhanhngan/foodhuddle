import {
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  ParseIntPipe,
  ParseFilePipe,
  Query,
  Res,
  UseGuards,
  Inject,
  Body,
  UploadedFiles,
  ValidationPipe,
  UseInterceptors,
  Put,
  Post,
  Req,
  Delete,
  ParseEnumPipe,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToClass, plainToInstance } from 'class-transformer';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  SessionInfoDTO,
  SessionPaymentDTO,
  UserPaymentDTO,
  CreateSession,
  UpdateSessionStatus,
  EditSession,
} from './dtos/';
import { fileFilter } from './helpers/file-filter.helper';
import { SessionPayment, SessionStatus, UserPayment } from 'src/entities';
import MaxFileSize from '../../helpers/validate-images-size';
import AcceptImageType from 'src/helpers/validate-images-type';
import { ImageResize } from 'src/helpers/resize-images';
import { AWSService } from '../aws/aws.service';
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
    private readonly imageResize: ImageResize,
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

  @Get('/host-payment-infor')
  async getHostPaymentInfor(@Res() res: Response) {
    try {
      const hostId = Object(res.req.user).id;

      const sessionByHostId =
        await this.sessionService.getLatestSessionByHostId(hostId);

      const hostPaymentInfor = sessionByHostId
        ? sessionByHostId.host_payment_info
        : '';

      const qr_images = sessionByHostId
        ? JSON.parse(sessionByHostId.qr_images)
        : [];

      return res.status(200).json({
        hostPaymentInfor: hostPaymentInfor,
        qrImages: qr_images,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR AT GETTING HOST PAYMENT INFORMATION');
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

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('qr_images'))
  async createNewSessionToday(
    @Body(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    newSession: CreateSession,
    @Req() req,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSize({
            maxSize: 5,
          }),
          new AcceptImageType({
            fileType: ['image/jpeg', 'image/png'],
          }),
        ],
        fileIsRequired: false,
      }),
    )
    files: Array<Express.Multer.File> | Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const { user } = req;

      const newSessionCreated = await this.sessionService.createNewSessionToday(
        newSession,
        user,
        files,
      );
      if (!newSession) {
        throw new InternalServerErrorException();
      }

      return res.status(newSessionCreated.status).json({
        statusCode: newSessionCreated.status,
        message: newSessionCreated.message,
        id: newSessionCreated.id,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR WHEN CREATING NEW SESSION TODAY');
      throw error;
    }
  }

  @UseGuards(SessionStatusGuard([SessionStatus.OPEN, SessionStatus.LOCKED]))
  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('qr_images'))
  async editSessionInfo(
    @Body(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    editSessionInfo: EditSession,
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSize({
            maxSize: 5,
          }),
          new AcceptImageType({
            fileType: ['image/jpeg', 'image/png'],
          }),
        ],
        fileIsRequired: false,
      }),
    )
    files: Array<Express.Multer.File> | Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const { user } = req;

      const editSession = await this.sessionService.editSessionInfo(
        id,
        editSessionInfo,
        user,
        files,
      );

      const sessionReturn = plainToInstance(SessionInfoDTO, editSession.data, {
        enableCircularCheck: true,
      });

      return res.status(editSession.status).json({
        statusCode: editSession.status,
        message: editSession.message,
        data: sessionReturn,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR WHEN EDITING SESSION INFORMATION');
      throw error;
    }
  }

  @Put('/:id/update-status')
  @UseGuards(JwtAuthGuard)
  async updateSessionStatus(
    @Body() dto: UpdateSessionStatus,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const hostId = Object(res.req.user).id;

      const resultUpdating = await this.sessionService.updateSessionStatus(
        id,
        dto,
        hostId,
      );

      return res.status(resultUpdating.status).json(resultUpdating);
    } catch (error) {
      this.logger.error('HAS AN ERROR AT UPDATING SESSION STATUS');
      throw error;
    }
  }

  @Get('/history')
  @UseGuards(JwtAuthGuard)
  async getAllSessionsHistory(
    @Query() query: { status: string },
    @Res() res: Response,
  ) {
    try {
      const statusFilter =
        query.status === undefined ? [] : query.status.split(',');

      const allSessionHistory = await this.sessionService.getAllSessionsHistory(
        statusFilter,
      );

      return res.status(200).json({
        statusCode: 200,
        data: allSessionHistory,
      });
    } catch (error) {
      this.logger.error(
        'Calling getAllSessionsHistory()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSession(@Param('id') id: number, @Res() res: Response) {
    try {
      const hostId = Object(res.req.user).id;

      const sessionById = await this.sessionService.getSessionById(id);

      if (sessionById === null) {
        return res.status(400).json({
          status: 400,
          message: 'Session does not exist!',
        });
      }

      const hostIdSession = sessionById.host.id;

      if (hostId !== hostIdSession) {
        return res.status(400).json({
          status: 400,
          message: `Only host can delete session!`,
        });
      }

      const resultDeleting = await this.sessionService.deleteSession(id);

      return res.status(resultDeleting.statusCode).json(resultDeleting);
    } catch (error) {
      this.logger.error('HAS AN ERROR WHEN DELETING SESSION !');
      throw error;
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

  @Get('/history/hosted')
  @UseGuards(JwtAuthGuard)
  async getAllSessionHostedHistoryByUserId(
    @Query() query: { status: Array<string> },
    @Res() res: Response,
  ) {
    try {
      const userId = Object(res.req.user).id;
      const statusFilter = query.status === undefined ? [] : query.status;
      const allSessionHostedHistoryByUserId =
        await this.sessionService.getAllSessionHostedHistoryByUserId(
          userId,
          statusFilter,
        );

      return res.status(200).json({
        statusCode: 200,
        data: allSessionHostedHistoryByUserId,
      });
    } catch (error) {
      this.logger.error(
        'HAS AN ERROR AT GETTING ALL SESSIONS HOSTED HISTORY BY USER ID',
      );
      throw error;
    }
  }

  @Get('/history/joined')
  @UseGuards(JwtAuthGuard)
  async getAllSessionsJoinedHistoryByUserId(
    @Query() query: { status: string },
    @Res() res: Response,
  ) {
    try {
      const userId = Object(res.req.user).id;
      const statusFilter =
        query.status === undefined ? [] : query.status.split(',');

      const allSessionsJoinedHistoryByUserId =
        await this.sessionService.getAllSessionsJoinedHistoryByUserId(
          userId,
          statusFilter,
        );

      return res.status(200).json({
        statusCode: 200,
        data: allSessionsJoinedHistoryByUserId,
      });
    } catch (error) {
      this.logger.error(
        'HAS AN ERROR AT GETTING ALL SESSIONS JOINED HISTORY BY USER ID',
      );
      throw error;
    }
  }

  @Put(':id/user-payment/change-status')
  @UseGuards(RolesGuard)
  @UseGuards(SessionStatusGuard([SessionStatus.PENDING_PAYMENTS]))
  async changeUserPaymentStatus(
    @Res() res: Response,
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('action', new ParseEnumPipe(UserPaymentAction))
    action: UserPaymentAction,
    @Body('userId', ParseIntPipe)
    userId: number,
  ) {
    try {
      const { session } = req;
      await this.sessionService.changeUserPaymentStatus(
        userId,
        session,
        action,
      );
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
  @UseGuards(
    SessionStatusGuard([
      SessionStatus.PENDING_PAYMENTS,
      SessionStatus.FINISHED,
    ]),
  )
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
