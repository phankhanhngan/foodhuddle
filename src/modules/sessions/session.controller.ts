import {
  Body,
  Post,
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  Res,
  UseGuards,
  UseInterceptors,
  Inject,
  UploadedFiles,
  ParseFilePipe,
  ValidationPipe,
  ParseIntPipe,
  Req,
  Put,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateSession } from './dtos/create-session.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import MaxFileSize from '../../helpers/validate-images-size';
import AcceptImageType from 'src/helpers/validate-images-type';
import { ImageResize } from 'src/helpers/resize-images';
import { EditSession } from './dtos/edit-session.dto';
import { plainToClass, plainToInstance } from 'class-transformer';
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
    private readonly imageResize: ImageResize,
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

  @UseGuards(JwtAuthGuard)
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
}
