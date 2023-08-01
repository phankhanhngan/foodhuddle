import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseFilePipe,
  Res,
  UseGuards,
  Inject,
  Body,
  ValidationPipe,
  UseInterceptors,
  UploadedFiles,
  Put,
  Post,
  Req,
  Delete,
  ParseEnumPipe,
  InternalServerErrorException,
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
  SessionStatusA,
} from './dtos/';
import { fileFilter } from './helpers/file-filter.helper';
import { SessionPayment, SessionStatus, UserPayment } from 'src/entities';
import MaxFileSize from '../../helpers/validate-images-size';
import AcceptImageType from 'src/helpers/validate-images-type';
import { ImageResize } from 'src/helpers/resize-images';
import {
  SessionStatusGuard,
  JwtAuthGuard,
  RolesGuard,
} from 'src/common/guards';
import { UserPaymentAction } from './enums/user-payment-action.enum';
import { AWSService } from '../aws/aws.service';

@UseGuards(JwtAuthGuard)
@Controller('session')
export class SessionController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly awsService: AWSService,
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

      const qr_images = sessionByHostId ? sessionByHostId.qr_images : '';

      return res.status(200).json({
        hostPaymentInfor: hostPaymentInfor,
        qr_images: qr_images,
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
    @Body() dto: CreateSession,
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
    files: Array<Express.Multer.File>,
    @Res() res: Response,
  ) {
    try {
      // const urlImages: Promise<string>[] = files.map(async (img) => {
      //   const resizedImage = await this.imageResize.resizeImage(img.buffer);

      //   const imageUrl = await this.awsService.uploadImage(
      //     resizedImage,
      //     img.originalname,
      //   );

      //   return imageUrl;
      // });

      // const listUrlImages = await Promise.all(urlImages);

      // const qrImagesUrl = JSON.stringify(Object.assign({}, listUrlImages));

      const hostId = Object(res.req.user).id;
      dto.host = hostId;
      dto.status = SessionStatusA.OPEN;
      // dto.qr_images = qrImagesUrl;

      const newSession = await this.sessionService.createNewSessionToday(dto);
      if (!newSession) {
        throw new InternalServerErrorException();
      }
      return res.status(200).json({
        statusCode: 200,
        message: 'Create new session successfully!',
        id: newSession.id,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR WHEN CREATING NEW SESSION TODAY');
      throw error;
    }
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  async updateSessionStatus(
    @Body() dto: UpdateSessionStatus,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const hostId = Object(res.req.user).id;

      const sessionById = await this.sessionService.getSessionById(id);

      if (!sessionById) {
        return res.status(400).json({
          status: 400,
          message: 'Session does not exist!',
        });
      }

      const hostIdSession = sessionById.host.id;

      if (hostId !== hostIdSession) {
        return res.status(400).json({
          status: 400,
          message: `Only host can change session's status to ${dto.status}`,
        });
      }

      const resultUpdating = await this.sessionService.updateSessionStatus(
        id,
        dto,
      );

      return res.status(resultUpdating.status).json(resultUpdating);
    } catch (error) {
      this.logger.error('HAS AN ERROR AT UPDATING SESSION STATUS');
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
