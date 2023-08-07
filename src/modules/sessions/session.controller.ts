import {
  Body,
  Post,
  Controller,
  Get,
  Res,
  UseGuards,
  UseInterceptors,
  Delete,
  Put,
  Inject,
  UploadedFiles,
  ParseFilePipe,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateSession } from './dtos/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSessionStatus } from './dtos/update-session_status.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import MaxFileSize from '../../helpers/validate-images-size';
import AcceptImageType from 'src/helpers/validate-images-type';
import { plainToClass } from 'class-transformer';

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
      this.logger.error('HAS AN ERROR AT GETTING ALL SESSIONS TODAY');
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

      if (!newSessionCreated) {
        return res.status(400).json({
          statusCode: 400,
          message: 'Has an error when creating new session !',
          id: null,
        });
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

  @Put('/:id/update-status')
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
}
