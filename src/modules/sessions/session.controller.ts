import {
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Res,
  UseGuards,
  Body,
  Post,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateSession } from './dtos/create-session.dto';
import { AWSService } from '../aws/aws.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToInstance } from 'class-transformer';
import { SessionInfoDTO } from './dtos/session-info.dto';
import MaxFileSize from '../../helpers/validate-images-size';
import AcceptImageType from 'src/helpers/validate-images-type';
import { plainToClass } from 'class-transformer';

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
        'Calling getAllSessionHostedTodayByUserId()',
        error,
        SessionService.name,
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
        'Calling getAllSessionsJoinedTodayByUserId()',
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
      this.logger.error(
        'Calling getHostPaymentInfor()',
        error,
        SessionService.name,
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

      const newSessionInfo = plainToClass(CreateSession, newSession);

      const newSessionCreated = await this.sessionService.createNewSessionToday(
        newSessionInfo,
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
      this.logger.error(
        'Calling createNewSessionToday()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }
}
